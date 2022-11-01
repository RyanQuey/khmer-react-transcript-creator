import PREFERRED_SPELLINGS from "./preferred-spellings.json";
import * as bookNames from "./book-names";
import _ from "lodash";

console.log(bookNames);

// make sure numbers correspond to index in array
const KHMER_NUMBERS = [
  // numbers
  "សូន្យ",
  "មួយ",
  "ពីរ",
  "បី",
  "បួន",
  "ប្រាំ",
  "ប្រាំមួយ",
  "ប្រាំពីរ",
  "ប្រាំបី",
  "ប្រាំបួន",
];
const KHMER_NUMERALS = [
  // numbers
  "០",
  "១",
  "២",
  "៣",
  "៤",
  "៥",
  "៦",
  "៧",
  "៨",
  "៩",
];

// none of these will require "sanna" (kh for "sign") before recognizing it
const KHMER_PUNCTUATION_NO_LEADER = {
  "ល៉ៈ ": "។ល។",
};
// for performance want to only run once, not for every word in every transcript!
const KHMER_PUNCTUATION_NO_LEADER_KEYS = Object.keys(
  KHMER_PUNCTUATION_NO_LEADER
);

// all of these will require "sanna" (kh for "sign") before recognizing it
const KHMER_PUNCTUATION = {
  ខណ្ឌ: "។ ",
  ខ័ណ្ឌ: "។ ",
  // need this one too since sometimes they actually return this correctly, but we're having users
  // say khPunctuationLeader bfeore it anyways...
  "។": "។ ",
  សួរ: "? ",
  ឧទាន: "! ",
};
// These are different. Keys will be what we want, values a list of the words.
// Makes it easy to iterate over and check for matches
// TODO for performance, don't iterate over same word "bauk" or "bit" every time!
const MULTI_WORD_KHMER_PUNCTUATION = {
  // TODO test. Maybe google separates words differently for example
  "(": [["បើក", "វង់", "ក្រចក"]],
  // TODO test. Maybe google separates words differently for example
  ")": [["បិត", "វង់", "ក្រចក"]],
  "៖": [["ចំណុច", "ពីរ", "គូស"]],
  "«": [
    ["បើក", "សញ្ញា", "អញ្ញ", "ប្រកាស"],
    // Google has read it this way before, so being flexible
    ["បើក", "សញ្ញា", "អាច", "ប្រកាស"],
    ["សញ្ញា", "បើក", "អាច", "ប្រកាស"],
    ["សញ្ញា", "បើក", "ៗ", "ប្រកាស"],
    ["បើក", "សញ្ញា", "អញ្ញ"],
    // Google has read it this way before, so being flexible
    ["បើក", "សញ្ញា", "ៗ"],
    ["សញ្ញា", "អញ្ញ", "បើក"],
    // Google has read it this way before, so being flexible
    ["សញ្ញា", "ៗ", "បើក"],
  ],
  "»": [
    // Google has read it this way before, so being flexible
    ["បិទ", "សញ្ញា", "អអាច", "ប្រកាស"],
    ["បិទ", "សញ្ញា", "អញ្ញ", "ប្រកាស"],
    ["សញ្ញា", "បិទ", "អញ្ញ", "ប្រកាស"],
    ["សញ្ញា", "បិទ", "ៗ", "ប្រកាស"],
    ["បិទ", "សញ្ញា", "អញ្ញ"],
    // Google has read it this way before, so being flexible
    ["បិទ", "សញ្ញា", "ៗ"],
    ["សញ្ញា", "អញ្ញ", "បិទ"],
    // Google has read it this way before, so being flexible
    ["សញ្ញា", "ៗ", "បិទ"],
  ],
};

const KHMER_PUNCTUATION_KEYS = Object.keys(KHMER_PUNCTUATION);
const ALL_KHMER_PUNCTUATION = Object.assign(
  KHMER_PUNCTUATION,
  KHMER_PUNCTUATION_NO_LEADER
);

const khPunctuationLeader = "សញ្ញា";
// hits anything with the khmer word for "number" before and then an Arabic numeral
const khNumber = "លេខ";
// keep khmer writing on separate line if possible, or else vim gets messed up

// if Google slams this together. Means "one duck" or "two ducks" but if in right context, we can
// assume a Bible verse
const bonusOrdinals = ["ទាមួយ", "ទាពីរ"];
const khOrdinalIndicatorArr = [
  "ទី",
  // because sometimes Google sees this here instead
  "ទា",
  "ទៀត",
].concat(bonusOrdinals);
const isNumber = (str) => str.match(/\d/) || KHMER_NUMBERS.includes(str);
const ALL_BOOKS_NO_NUM = bookNames.ALL_BOOKS_NO_NUM;

export default {
  // for different parts of a book, e.g., 1 Kings
  khPart: "ខ្សែ",
  khOrdinalIndicatorArr,
  khOrdinalIndicatorRegEx: new RegExp(`${khOrdinalIndicatorArr.join("|")}`),
  khOrdinalRegEx: new RegExp(
    `(${khOrdinalIndicatorArr.join("|")})(\d|${KHMER_NUMBERS.join("|")})`
  ),
  khNumber,
  khChapter: "ជំពូក",
  // including some misspellings
  khChapterRegex: new RegExp("ជំពូក|ចំពោះ|ជំពោះ"),
  khVerse: "ខ",
  // including some misspellings
  khVerseRegex: new RegExp("ខ|ខល"),
  referencesRegex: /\s?ជំពូក\s?(\d+)\s?ខ\s?(\d+)/gi,
  // if colon before or after, counting it as reference, so handling differently
  khmerNumberRegex: new RegExp(`(${khNumber})?\\s?(\\d)`, "gi"),
  // global regexs don't capture
  nonGlobalRegex: (reg) => new RegExp(reg.source, "i"),
  // TODO I'm sure there's a more performant way to do this, but unless it's a math transcript we
  // shouldn't call this too often anyways
  isNumber,
  convertToKhmerNumeral: (numStr) => {
    const spelledOutIndex = KHMER_NUMBERS.indexOf(numStr);
    let ret;
    if (spelledOutIndex != -1) {
      ret = KHMER_NUMERALS[spelledOutIndex];
    } else {
      ret = "";
      // make sure if multidigit string, converts all
      for (let i = 0; i < numStr.length; i++) {
        ret += KHMER_NUMERALS[numStr[i]];
      }
    }

    return ret;
  },
  punctuationRegex: new RegExp(
    Object.keys(ALL_KHMER_PUNCTUATION).join("|"),
    "gi"
  ),
  // NOTE don't use when looking at individual words
  preferredSpellingRegex: new RegExp(
    Object.keys(PREFERRED_SPELLINGS).join("|"),
    "gi"
  ),

  khPunctuationLeader,
  isEnglish: (wordData) => wordData.word.match(/^[a-zA-Z]+$/),

  KHMER_PUNCTUATION,
  KHMER_PUNCTUATION_NO_LEADER,
  KHMER_PUNCTUATION_KEYS,
  KHMER_PUNCTUATION_NO_LEADER_KEYS,
  KHMER_NUMERALS,
  KHMER_NUMBERS,
  PREFERRED_SPELLINGS,
  ZERO_WIDTH_SPACE: "\u200B",
  ALL_BOOKS_NO_NUM,
  BOOKS_WITH_MANY_NO_NUM: bookNames.BOOKS_WITH_MANY_NO_NUM,
  bonusOrdinals,
  // check if set of two words returns an ordinal
  isOrdinal: (word1, word2) =>
    (khOrdinalIndicatorArr.includes(word1) &&
      (KHMER_NUMBERS.includes(word2) || isNumber(word2))) ||
    // hacky, but necessary to get edge cases
    bonusOrdinals.includes(word1),

  /*
   * - takes a single word, which is from the utterance.alternatives[0].words array, and is tagged
   * - since punctuation is dependent upon whether or not there is a following word and what it's
   *   like, we need that info too
   * @return boolean, whether or not there should be a real space (ie NOT zero-width space)
   */

  wordIsFollowedBySpace(wordData, nextWordData) {
    const isFollowedBySpace =
      nextWordData &&
      ((!nextWordData.tags.includes("end-of-sentence") &&
        !nextWordData.tags.includes("closing-punctuation") &&
        wordData.tags.includes("followed-by-nbsp")) ||
        nextWordData.tags.includes("preceded-by-nbsp"));

    return isFollowedBySpace;
  },

  /*
   * find sentences that are for punctuation, but are multiple words, e.g., for parenthesse and quotes.
   */
  multiwordPunctuationMatch: (allWords, currentIndex) => {
    let keys = Object.keys(MULTI_WORD_KHMER_PUNCTUATION);
    // iterate over each punctuation to see if there's a match
    let ret = false;
    // using some so stops when return true
    keys.some((key) => {
      // each punctuation might have multiple possible matches. Iterate over each one
      let possibilitySet = MULTI_WORD_KHMER_PUNCTUATION[key];
      // using some so stops when return true
      // returning this, so stops enclosing some call also if this returns true
      return possibilitySet.some((valArr) => {
        // iterate over each word in the multi-word command to see if all match
        // allWords[currentIndex] is the current word. i starts at 0, and sees if each word matches in
        // succession
        let match = valArr.every((wordToMatch, i) => {
          return (
            allWords[currentIndex + i] &&
            wordToMatch == allWords[currentIndex + i].word
          );
        });
        if (match) {
          let wordData = allWords[currentIndex];
          let matchedWordsData = _.range(valArr.length).map(
            (i) => allWords[currentIndex + i]
          );

          ret = {
            punctuation: key, // in this case, we're using the punctuation mark we want to return as key
            multiwordLength: matchedWordsData.length,
            originalWordData: { wordData },
            averageConfidence:
              matchedWordsData.reduce((acc, val) => acc + val.confidence, 0) /
              matchedWordsData.length,
            endTime: _.last(matchedWordsData).endTime,
          };

          // TODO for these use cases, rename key from secondWordData to "wordData2" so can easily
          // set using originalWordData[`wordData${i}`]
          if (valArr.length > 1) {
            ret.originalWordData.secondWordData = matchedWordsData[1];
          }
          if (valArr.length > 2) {
            ret.originalWordData.thirdWordData = matchedWordsData[2];
          }
          if (valArr.length > 3) {
            ret.originalWordData.fourthWordData = matchedWordsData[3];
          }
          // shouldn't be more than 4, but to be safe
          if (valArr.length > 4) {
            ret.originalWordData.fourthWordData = matchedWordsData[4];
          }

          return true;
        }
      });
    });

    return ret;
  },
};

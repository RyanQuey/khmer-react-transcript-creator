import React, { Component } from "react";
// import getAudio from './getAudio'
import SpeechRecognition from "../updated-react-speech-recognition/src/";
import {
  secondsToTimecode,
  timecodeToSeconds,
} from "../Util/timecode-converter/index";
import "./style.css";

import { Editor, EditorState, SelectionState, Modifier, ContentState } from "draft-js";
import { combineKeywords } from "./helpers/combine-keywords";
import { split } from "split-khmer";
import Helpers from "./helpers/khmer-helpers";

/*
const propTypes = {
  // Props injected by SpeechRecognition
  transcript: PropTypes.string,
  resetTranscript: PropTypes.func,
  browserSupportsSpeechRecognition: PropTypes.bool
}
*/

const manualFixes = [
  {
    modified: "សេចក**ី",
    target: "សេចក្ដី",
  },
  {
    modified: "ក**ៅ",
    target: "ក្ដៅ",
  },
];

const languages = [
  ["AF", "Afrikaans"],
  ["SQ", "Albanian"], 
  ["AR", "Arabic"], 
  ["HY", "Armenian"], 
  ["EU", "Basque"], 
  ["BN", "Bengali"], 
  ["BG", "Bulgarian"], 
  ["CA", "Catalan"], 
  ["ZH", "Chinese (Mandarin)"], 
  ["HR", "Croatian"], 
  ["CS", "Czech"], 
  ["DA", "Danish"], 
  ["NL", "Dutch"], 
  ["EN", "English"], 
  ["ET", "Estonian"], 
  ["FJ", "Fiji"], 
  ["FI", "Finnish"], 
  ["FR", "French"], 
  ["KA", "Georgian"], 
  ["DE", "German"], 
  ["EL", "Greek"], 
  ["GU", "Gujarati"], 
  ["HE", "Hebrew"], 
  ["HI", "Hindi"], 
  ["HU", "Hungarian"], 
  ["IS", "Icelandic"], 
  ["ID", "Indonesian"], 
  ["GA", "Irish"], 
  ["IT", "Italian"], 
  ["JA", "Japanese"], 
  ["JW", "Javanese"], 
  ["KM", "Khmer"], 
  ["KO", "Korean"], 
  ["LA", "Latin"], 
  ["LV", "Latvian"], 
  ["LT", "Lithuanian"], 
  ["MK", "Macedonian"], 
  ["MS", "Malay"], 
  ["ML", "Malayalam"], 
  ["MT", "Maltese"], 
  ["MI", "Maori"], 
  ["MR", "Marathi"], 
  ["MN", "Mongolian"], 
  ["NE", "Nepali"], 
  ["NO", "Norwegian"], 
  ["FA", "Persian"], 
  ["PL", "Polish"], 
  ["PT", "Portuguese"], 
  ["PA", "Punjabi"], 
  ["QU", "Quechua"], 
  ["RO", "Romanian"], 
  ["RU", "Russian"], 
  ["SM", "Samoan"], 
  ["SR", "Serbian"], 
  ["SK", "Slovak"], 
  ["SL", "Slovenian"], 
  ["ES", "Spanish"], 
  ["SW", "Swahili"], 
  ["SV", "Swedish "], 
  ["TA", "Tamil"], 
  ["TT", "Tatar"], 
  ["TE", "Telugu"], 
  ["TH", "Thai"], 
  ["BO", "Tibetan"], 
  ["TO", "Tonga"], 
  ["TR", "Turkish"], 
  ["UK", "Ukrainian"], 
  ["UR", "Urdu"], 
  ["UZ", "Uzbek"], 
  ["VI", "Vietnamese"], 
  ["CY", "Welsh"], 
  ["XH", "Xhosa"], 
]
  
const tmpLocalStorageKey = "khmer-replacer-json-LATEST"

class GenerateTranscript extends Component {
  constructor(props) {
    super(props);
    const editorState = EditorState.createEmpty();
    this.state = {
      error: "",
      words: [],
      editorState: EditorState.moveFocusToEnd(editorState),
      oldWords: [],
      oldEditorState: null,
      // the parsed json obj to use in replacing
      replacer: {},
      // the string that sits in the field
      replacerTextareaValue: "",
      // a backup, that is changed whenever save/retrieve happens
      backupReplacerTextareaValue: "",
      shouldAddSpace: false,
    };

    this.onChange = (editorState) => this.setState({ editorState });
    this.pause = this.pause.bind(this);
    this.start = this.start.bind(this);
    this.reset = this.reset.bind(this);
    this.copy = this.copy.bind(this);
    this.undo = this.undo.bind(this);
    this.resplit = this.resplit.bind(this);
    this.changeReplacerHook = this.changeReplacerHook.bind(this);
    this.setReplacerLocalStorage = this.setReplacerLocalStorage.bind(this);
    this.getReplacerFromLocalStorage = this.getReplacerFromLocalStorage.bind(this);


    // props.recognition.onresult
    // set default language to Khmer TODO add options?
    // https://www.science.co.il/language/Locale-codes.php for codes
    props.recognition.lang = "KM";
  }

  componentDidMount () {
    // pull from temp storage
    console.log("on mount hook")
    this.getReplacerFromLocalStorage(null, "LATEST")
  }

  static getDerivedStateFromProps(props, state) {
    if (
      props.transcriptData &&
      props.transcriptData.words.length > state.words.length
    ) {
      const sentence =
        props.transcriptData.words[props.transcriptData.words.length - 1];

      try {
        let phrase = sentence.word;
        let textToAdd = "";
        if (props.recognition.lang === "KM") {
          manualFixes.forEach((modifier) => {
            phrase = phrase.replace(modifier.modified, modifier.target);
          });

          const splitWords = combineKeywords(
            split(phrase).map((word) => {
              return {
                ...sentence,
                word: Helpers.PREFERRED_SPELLINGS[word] || state.replacer[word] || word,
              };
            })
          );
          textToAdd = splitWords
            .map((word) => word.word)
            .join(Helpers.ZERO_WIDTH_SPACE);
        } else {
          textToAdd = phrase
            .split(" ")
            .map((word) => state.replacer[word] || word)
            .join(" ");
        }
        textToAdd += state.shouldAddSpace ? " " : "";
        const currentContent = state.editorState.getCurrentContent();

        // create new selection state where focus is at the end
        const selection = state.editorState.getSelection();
        //insert text at the selection created above
        const textWithInsert = Modifier.insertText(
          currentContent,
          selection,
          textToAdd,
          null
        );
        const newEditorState = EditorState.push(
          state.editorState,
          textWithInsert,
          "insert-characters"
        );

        return {
          ...state,
          editorState: newEditorState,
          words: [...props.transcriptData.words],
        };
      } catch (e) {
        console.error(e);
        return {
          ...state,
          error: "Could not add " + sentence.word,
        };
      }
    }

    return null;
  }


  reset(e) {
    e.preventDefault()

    this.props.stopListening();
    this.props.resetTranscript();
    const editorState = EditorState.createEmpty();
    this.setState({
      error: "",
      editorState: EditorState.moveFocusToEnd(editorState),
      words: [],
      oldEditorState: this.state.editorState,
      oldWords: this.state.words,
    });
  }

  start(e) {
    e.preventDefault()
    this.props.startListening();
  }

  pause(e) {
    e.preventDefault()
    this.props.stopListening();
  }

  copy(e) {
    e.preventDefault()
    const text = this.state.editorState.getCurrentContent().getPlainText();
    var input = document.createElement("input");
    input.setAttribute("value", text);
    document.body.appendChild(input);
    input.select();
    var result = document.execCommand("copy");
    document.body.removeChild(input);
    return result;
  }
  undo(e) {
    this.setState({
      ...this.state,
      oldEditorState: null,
      oldWords: null,
      editorState: this.state.oldEditorState,
      words: this.state.oldWords,
    });
  }

  /**
   *
   * pass in "LATEST" in order to get last auto-saved text
   */ 
  getReplacerFromLocalStorage(e, index) {
    e && e.preventDefault()

    const localStorageKey = `khmer-replacer-json-${index}`
    console.log("retrieving from: ", localStorageKey)
    const retrievedReplacer = localStorage.getItem(localStorageKey)
    console.log("retrieved: ",retrievedReplacer)

    this.changeReplacerHook(null, retrievedReplacer)
  }

  setReplacerLocalStorage(e, index) {
    e && e.preventDefault()

    try { 
      const newReplacer = this.state.replacerTextareaValue
      console.log("saving to local storage: ",newReplacer)
      this.setState("backupReplacerTextareaValue", newReplacer)
      localStorage.setItem(`khmer-replacer-json-${index}`, newReplacer)

    } catch(err){
      console.error(err)
    }
  }

  changeReplacerHook(e, value) {
    e && e.preventDefault()
    const replacerValue = value || e && e.target.value
    // NOTE make sure this is a string as we pass it in
    console.log("set tmp local storage!")
    localStorage.setItem(tmpLocalStorageKey, replacerValue)
    this.setState({replacerTextareaValue: replacerValue || ""});

    try { 

      const newReplacer = JSON.parse(replacerValue);
      this.setState({replacer: newReplacer});
      console.log("set to", newReplacer)

    } catch(err){
      console.error(err)
      console.log("temporarily using no replacer at all...(but not changing the text in the editor")
      this.setState({replacer: {}});
    }
  }

  resplit(e) {
    var text = this.state.editorState.getCurrentContent().getPlainText();
    text = text.replace(Helpers.ZERO_WIDTH_SPACE, '');
    const splitWords = split(text);
    var textToAdd = splitWords.join(Helpers.ZERO_WIDTH_SPACE);
    const newEditorState = EditorState.createWithContent(ContentState.createFromText(textToAdd));
    this.setState({
        editorState: newEditorState,
        oldEditorState: this.state.editorState,
    });
  }

  render() {
    const {
      transcript,
      browserSupportsSpeechRecognition,
      // interimTranscript,
      listening,
      // allResults
    } = this.props;

    if (!browserSupportsSpeechRecognition) {
      // NOTE happens several times, as this gets rerendered for some reason. Returns false even when browser can support sometimes for some reason too, but eventually returns true
      return null;
    }
    //TODO add back in once we switch over to using my fork  which passes down all results as an array rather than compiling all into a string

    return (
      <div>
        <h1>Speech Recognition v2.0.9</h1>
        <select
          onChange={(e) => {
            this.props.recognition.lang = e.target.value;
          }}
          defaultValue={this.props.recognition.lang}
          data-placeholder="Choose a Language..."
        >
          {languages.map(lang => (
            <option value={lang[0]}>{lang[1]}</option>
          ))}
        </select>
        <button
          disabled={!this.state.oldEditorState}
          onClick={this.undo}
        >
          Undo
        </button>
        <button onClick={this.reset}>
          Reset
        </button>
        <button onClick={this.start}>
          Start
        </button>
        <button onClick={this.pause}>
          Pause
        </button>
        <button onClick={this.copy}>
          Copy
        </button>
        <button onClick={this.resplit}>
          Resplit
        </button>

        <label>
          Should add space?:
          <input
            name="shouldAddSpace"
            type="checkbox"
            checked={this.state.shouldAddSpace}
            onChange={(e) => {
              this.setState({ shouldAddSpace: !this.state.shouldAddSpace });
            }}
          />
        </label>

        {/* <button disabled={!this.props.finalTranscript || this.props.finalTranscript !== this.props.transcript} onClick={this.stop} onMouseDown={e => e.preventDefault()}>Insert</button> */}
        <br />
        <div className="transcript-container">
          In progress:{" "}
          {this.props.finalTranscript !== this.props.transcript
            ? this.props.interimTranscript
            : ""}{" "}
          ...
          <br />
          {this.state.error && (
            <span style={{ color: "red" }}>{this.state.error}</span>
          )}
        </div>
        {listening ? (
          <span>
            *Listening* Total Time Elapsed:{" "}
            {secondsToTimecode(this.props.totalTimeElapsed)}
          </span>
        ) : (
          <div>&nbsp;</div>
        )}
        <Editor editorState={this.state.editorState} onChange={this.onChange} />

        <br />
        <div>
          <label>Replacer: </label>
          <textarea 
            style={{width: "400px"}} 
            placeholder='Ex. {"target": "modifier", "target2": "modifier2"}' 
            onChange={this.changeReplacerHook} 
            value={this.state.replacerTextareaValue}
          />
        </div>

        <div>
          {[1,2].map(index => (
            <div>
              <button onClick={(e) => this.setReplacerLocalStorage(e, index)}>
                Save to options #{index}
              </button>
              <button onClick={(e) => this.getReplacerFromLocalStorage(e, index)}>
                Retrieve from options #{index}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

// GenerateTranscript.propTypes = propTypes

const options = {
  autoStart: false,
};
export default SpeechRecognition(options)(GenerateTranscript);

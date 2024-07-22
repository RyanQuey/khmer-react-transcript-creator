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
      replacer: {},
      shouldAddSpace: false,
    };
    this.onChange = (editorState) => this.setState({ editorState });
    this.pause = this.pause.bind(this);
    this.start = this.start.bind(this);
    this.reset = this.reset.bind(this);
    this.copy = this.copy.bind(this);
    this.undo = this.undo.bind(this);
    this.resplit = this.resplit.bind(this);

    // props.recognition.onresult
    // set default language to Khmer TODO add options?
    // https://www.science.co.il/language/Locale-codes.php for codes
    props.recognition.lang = "KM";
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
    this.props.startListening();
  }

  pause(e) {
    this.props.stopListening();
  }

  copy(e) {
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
        <h1>Speech Recognition v2.0.8</h1>
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
          onMouseDown={(e) => e.preventDefault()}
        >
          Undo
        </button>
        <button onClick={this.reset} onMouseDown={(e) => e.preventDefault()}>
          Reset
        </button>
        <button onClick={this.start} onMouseDown={(e) => e.preventDefault()}>
          Start
        </button>
        <button onClick={this.pause} onMouseDown={(e) => e.preventDefault()}>
          Pause
        </button>
        <button onClick={this.copy} onMouseDown={(e) => e.preventDefault()}>
          Copy
        </button>
        <button onClick={this.resplit} onMouseDown={(e) => e.preventDefault()}>
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
        <label>Replacer: </label>
        <textarea style={{width: "400px"}} placeholder='Ex. {"target": "modifier", "target2": "modifier2"}' onChange={(e) => {
          try { 
            const newReplacer = JSON.parse(e.target.value);
            this.setState({replacer: newReplacer});
          }
          catch(e){
            this.setState({replacer: {}});
          }
        }} />
        {false && (
          <div>
            <p>Volume</p>
            <input
              id="volume"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value="0.5"
            />
          </div>
        )}
      </div>
    );
  }
}

// GenerateTranscript.propTypes = propTypes

const options = {
  autoStart: false,
};
export default SpeechRecognition(options)(GenerateTranscript);

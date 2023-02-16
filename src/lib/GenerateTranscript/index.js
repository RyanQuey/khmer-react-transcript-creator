import React, { Component } from "react";
// import getAudio from './getAudio'
import SpeechRecognition from "../updated-react-speech-recognition/src/";
import {
  secondsToTimecode,
  timecodeToSeconds,
} from "../Util/timecode-converter/index";
import "./style.css";

import { Editor, EditorState, SelectionState, Modifier } from "draft-js";
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
        <h1>Speech Recognition v2.0.6</h1>
        <select
          onChange={(e) => {
            this.props.recognition.lang = e.target.value;
          }}
          defaultValue={this.props.recognition.lang}
          data-placeholder="Choose a Language..."
        >
          <option value="AF">Afrikaans</option>
          <option value="SQ">Albanian</option>
          <option value="AR">Arabic</option>
          <option value="HY">Armenian</option>
          <option value="EU">Basque</option>
          <option value="BN">Bengali</option>
          <option value="BG">Bulgarian</option>
          <option value="CA">Catalan</option>
          <option value="KM">Cambodian</option>
          <option value="ZH">Chinese (Mandarin)</option>
          <option value="HR">Croatian</option>
          <option value="CS">Czech</option>
          <option value="DA">Danish</option>
          <option value="NL">Dutch</option>
          <option value="EN">English</option>
          <option value="ET">Estonian</option>
          <option value="FJ">Fiji</option>
          <option value="FI">Finnish</option>
          <option value="FR">French</option>
          <option value="KA">Georgian</option>
          <option value="DE">German</option>
          <option value="EL">Greek</option>
          <option value="GU">Gujarati</option>
          <option value="HE">Hebrew</option>
          <option value="HI">Hindi</option>
          <option value="HU">Hungarian</option>
          <option value="IS">Icelandic</option>
          <option value="ID">Indonesian</option>
          <option value="GA">Irish</option>
          <option value="IT">Italian</option>
          <option value="JA">Japanese</option>
          <option value="JW">Javanese</option>
          <option value="KO">Korean</option>
          <option value="LA">Latin</option>
          <option value="LV">Latvian</option>
          <option value="LT">Lithuanian</option>
          <option value="MK">Macedonian</option>
          <option value="MS">Malay</option>
          <option value="ML">Malayalam</option>
          <option value="MT">Maltese</option>
          <option value="MI">Maori</option>
          <option value="MR">Marathi</option>
          <option value="MN">Mongolian</option>
          <option value="NE">Nepali</option>
          <option value="NO">Norwegian</option>
          <option value="FA">Persian</option>
          <option value="PL">Polish</option>
          <option value="PT">Portuguese</option>
          <option value="PA">Punjabi</option>
          <option value="QU">Quechua</option>
          <option value="RO">Romanian</option>
          <option value="RU">Russian</option>
          <option value="SM">Samoan</option>
          <option value="SR">Serbian</option>
          <option value="SK">Slovak</option>
          <option value="SL">Slovenian</option>
          <option value="ES">Spanish</option>
          <option value="SW">Swahili</option>
          <option value="SV">Swedish </option>
          <option value="TA">Tamil</option>
          <option value="TT">Tatar</option>
          <option value="TE">Telugu</option>
          <option value="TH">Thai</option>
          <option value="BO">Tibetan</option>
          <option value="TO">Tonga</option>
          <option value="TR">Turkish</option>
          <option value="UK">Ukrainian</option>
          <option value="UR">Urdu</option>
          <option value="UZ">Uzbek</option>
          <option value="VI">Vietnamese</option>
          <option value="CY">Welsh</option>
          <option value="XH">Xhosa</option>
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
        <label>
          Should add space?:
          <input
            name="isGoing"
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

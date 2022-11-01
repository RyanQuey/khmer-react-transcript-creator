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
    };
    this.onChange = (editorState) => this.setState({ editorState });
    this.pause = this.pause.bind(this);
    this.start = this.start.bind(this);
    this.reset = this.reset.bind(this);
    this.copy = this.copy.bind(this);

    // props.recognition.onresult
    // set default language to Khmer TODO add options?
    // https://www.science.co.il/language/Locale-codes.php for codes
    props.recognition.lang = "km";
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
        manualFixes.forEach((modifier) => {
          phrase = phrase.replace(modifier.modified, modifier.target);
        });

        const splitWords = combineKeywords(
          split(phrase).map((word) => {
            return {
              ...sentence,
              word: Helpers.PREFERRED_SPELLINGS[word] || word,
            };
          })
        );
        const textToAdd = splitWords
          .map((word) => word.word)
          .join(Helpers.ZERO_WIDTH_SPACE);
        // get current editor state
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
          words: [...props.transcriptData.words],
          editorState: newEditorState,
        };
      } catch (e) {
        return {
          ...state,
          error: "Could not add " + sentence,
        };
      }
    }

    return null;
  }

  // componentDidMount() {
  //   this.setState({
  //     editorState: EditorState.moveFocusToEnd(this.state.editorState), // EditorState imported from draft-js
  //   });
  // }
  componentDidUpdate(prevProps) {
    if (
      this.props.playingWhileListening &&
      !prevProps.playingWhileListening &&
      !this.props.listening
    ) {
      this.props.startListening();
    }
  }

  reset(e) {
    this.props.stopListening();
    this.props.resetTranscript();
    const editorState = EditorState.createEmpty();
    this.setState({
      editorState: EditorState.moveFocusToEnd(editorState),
      words: [],
      error: "",
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
        <h1>Speech Recognition v2.0.1</h1>
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

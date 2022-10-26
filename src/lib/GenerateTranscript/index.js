import React, { Component } from "react";
// import getAudio from './getAudio'
import SpeechRecognition from "../updated-react-speech-recognition/src/";
import {
  secondsToTimecode,
  timecodeToSeconds,
} from "../Util/timecode-converter/index";
import "./style.css";

import { Editor, EditorState, SelectionState, Modifier } from "draft-js";

/*
const propTypes = {
  // Props injected by SpeechRecognition
  transcript: PropTypes.string,
  resetTranscript: PropTypes.func,
  browserSupportsSpeechRecognition: PropTypes.bool
}
*/

class GenerateTranscript extends Component {
  constructor(props) {
    super(props);
    this.state = {
      history: [],
      editorState: EditorState.createEmpty(),
    };
    this.onChange = (editorState) => this.setState({ editorState });

    this.stop = this.stop.bind(this);
    this.pause = this.pause.bind(this);
    this.start = this.start.bind(this);
    this.reset = this.reset.bind(this);

    // props.recognition.onresult
    // set default language to Khmer TODO add options?
    // https://www.science.co.il/language/Locale-codes.php for codes
    props.recognition.lang = "en"; //"km";
  }
  componentDidMount() {
    this.setState({
      editorState:  EditorState.moveFocusToEnd(this.state.editorState), // EditorState imported from draft-js
    });
  }
  componentDidUpdate(prevProps) {
    if (
      this.props.playingWhileListening &&
      !prevProps.playingWhileListening &&
      !this.props.listening
    ) {
      this.props.startListening();
    }
  }
  insertAtCursor(text) {
    const editorState = this.state.editorState;
    // get current editor state
    const currentContent = editorState.getCurrentContent();

    // create new selection state where focus is at the end
    const selection = editorState.getSelection();
    //insert text at the selection created above
    const textWithInsert = Modifier.insertText(
      currentContent,
      selection,
      text,
      null
    );
    const editorWithInsert = EditorState.push(
      editorState,
      textWithInsert,
      "insert-characters"
    );

    this.setState({
      editorState: editorWithInsert,
    });
  }
  stop(e) {
    this.props.stopListening();
    this.insertAtCursor(this.props.finalTranscript + " ");
    this.props.resetTranscript();
  }
  pause(e) {
    this.props.stopListening();
  }
  start(e) {
    this.props.startListening();
  }
  
  reset(e) {
    this.props.stopListening();
    this.props.resetTranscript();
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
        <h1>Speech Recognition</h1>
        <button onClick={this.reset} onMouseDown={e => e.preventDefault()}>Reset</button>
        <button onClick={this.start} onMouseDown={e => e.preventDefault()}>Start</button>
        <button onClick={this.pause} onMouseDown={e => e.preventDefault()}>Pause</button>
        <button disabled={!this.props.finalTranscript || this.props.finalTranscript !== this.props.transcript} onClick={this.stop} onMouseDown={e => e.preventDefault()}>Insert</button>
        <br />
        <div
          className="transcript-container"
        >
          {this.props.transcript}
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

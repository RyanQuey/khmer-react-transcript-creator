import React, { Component } from 'react'
// import getAudio from './getAudio'
import SpeechRecognition from '../react-speech-recognition/src/'
let counter = 1

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
    };

    this.stop = this.stop.bind(this)
    this.start = this.start.bind(this)
    this.reset = this.reset.bind(this)
    this.generateJSON = this.generateJSON.bind(this)

    // props.recognition.onresult
    // set default language to Khmer TODO add options?
    // https://www.science.co.il/language/Locale-codes.php for codes
    props.recognition.lang = "km"
  }

  componentWillMount() {
  }

  stop(e) {
    this.props.stopListening()
  }
  start(e) {
    // console.log("starting")
    this.props.startListening()
  }
  generateJSON(e) {
    let transcriptJSON = {
      action: "audio-transcribe",
      retval: this.props.transcriptData
    }
    // if use finalTranscript, anything that hasn't been finalized isn't counted, which would be confusing, since even if you wait sometimes it isn't yet made final
    transcriptJSON.retval.punct = this.props.transcript

    this.setState({
      transcriptJSON
    })

    // console.log(transcriptJSON)
    // content, filename, format
    let filename = this.props.fileName.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").replace(/\s/g, "-")
    let prettyData = JSON.stringify(transcriptJSON, null, 4)

    this.props.download(prettyData, `${ filename }.json`)

    return transcriptJSON
  }
  reset(e) {
    this.props.resetTranscript()
  }
  render() {
    const {
      transcript,
      browserSupportsSpeechRecognition,
      // interimTranscript,
      listening,
      // allResults
    } = this.props

    if (!browserSupportsSpeechRecognition) {
      // NOTE happens several times, as this gets rerendered for some reason. Returns false even when browser can support sometimes for some reason too, but eventually returns true
      return null
    }
    if (listening) {
      counter ++
    }
    //TODO add back in once we switch over to using my fork  which passes down all results as an array rather than compiling all into a string
    //console.log(allResults)

    return (
      <div>
        <h1>Speech Recognition</h1>
        <button onClick = { this.reset } >Reset</button>
        <button onClick = { this.start } >Start</button>
        <button onClick = { this.stop } >Stop</button>
        <button onClick = { this.generateJSON } >Generate</button>
        <div>
          {/*text.map((phrase, i) => */
            <span>{transcript}</span>
          }
        </div>
        { listening ? (
          <span>
            {counter % 2 == 0 ? <div>&nbsp;</div> : "**"}
          </span>
        ) : (
          <div>&nbsp;</div>
        )}
        <p>Volume</p>
        <input id="volume" type="range" min="0" max="1" step="0.1" value="0.5"/>

      </div>
    )
  }
}

// GenerateTranscript.propTypes = propTypes

const options = {
  autoStart: false
}
export default SpeechRecognition(options)(GenerateTranscript)

import React, { Component } from 'react'

export default function SpeechRecognition(options) {
  const SpeechRecognitionInner = function (WrappedComponent) {
    const BrowserSpeechRecognition =
      typeof window !== 'undefined' &&
      (window.SpeechRecognitionAlternative ||
        window.webkitSpeechRecognition ||
        window.mozSpeechRecognition ||
        window.msSpeechRecognition ||
        window.oSpeechRecognition)
    const recognition = BrowserSpeechRecognition
      ? new BrowserSpeechRecognition()
      : null
    const browserSupportsSpeechRecognition = recognition !== null
    let listening
    if (
      !browserSupportsSpeechRecognition ||
      (options && options.autoStart === false)
    ) {
      listening = false
    } else {
      recognition.start()
      listening = true
    }
    let pauseAfterDisconnect = false
    let interimTranscript = ''
    let finalTranscript = ''

    // TODO put this as the retval key using template found in src/sample-data/KateDarling_2018S-bbc-kaldi.json
    const newTranscriptData = () => ({
      status: true,
      wonid: "octo:2692ea33-d595-41d8-bfd5-aa7f2d2f89ee", // don't know this one, probably will generate something
      punct: "", // total transcript of all the words TODO currently not setting
      words: [], // array of newWordData objects
    })
    

    return class SpeechRecognitionContainer extends Component {
      constructor(props) {
        super(props)

        this.state = {
          interimTranscript,
          finalTranscript,
          transcriptData: {},
          listening: false,
          allResults: [],
          speechTimerStartedAt: false, // ms since Jan 1 1970
        }

        // TODO do the binding thing so don't have to do the crazy arrow funcs here
      }

      componentWillMount() {
        if (recognition) {
          recognition.continuous = false // originally set to true, but this breaks up the words into smaller fragments much better
          recognition.interimResults = true
          recognition.onresult = this.updateTranscript.bind(this)
          recognition.onend = this.onRecognitionDisconnect.bind(this)
          // onspeechstart/end or onsoundstart/end might be useful
          /*
    recognition.onspeechend = () => {console.log("speech is now ending")}
    recognition.onspeechstart = () => {console.log("speech is now starting")}
    recognition.onsoundstart = () => {console.log("sound is now starting")}
    recognition.onsoundend = () => {console.log("sound is now ending")}
    recognition.nomatch = () => {console.log("no match!!!11")}
    recognition.onboundary = () => {console.log("boundary found!")}
    recognition.onresume = () => {console.log("resume found!")}
    recognition.onmark = () => {console.log("mark found!")}
    recognition.onpause = () => {console.log("pause found!")}
    */
          this.setState({
            listening,
            transcriptData: newTranscriptData()
          })
        }
      }

      disconnect (disconnectType) {
        if (recognition) {
          switch (disconnectType) {
            case 'ABORT':
              pauseAfterDisconnect = true
              recognition.abort()
              break
            case 'RESET':
              pauseAfterDisconnect = true
              recognition.abort()
              break
            case 'STOP':
            default:
              pauseAfterDisconnect = true
              recognition.stop()
          }
        }
      }

      // minutes elapsed since started.
      minElapsed = () => {
        return (Date.now() - this.state.speechTimerStartedAt)/1000;
      }

      newWordData = (wordResults) => {
        const words = wordResults.transcript;
        // remove all punctuation and lowercase it
        const allWordData = this.state.transcriptData.words;
        const start = allWordData.length > 0 ? allWordData[allWordData.length - 1].end : 0;
        const end = this.minElapsed();
        const punct = words.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');

        // format required for the bbc lib
        return {
          start, // time in minutes, using decimals not seconds, eg 13.02 (float)
          confidence: wordResults.confidence, // %, out of 1, eg 0.68 (float)
          end, // end time in min
          word: words, // all words, not formatted (and lowercase), eg "there" (string)
          punct, // word, as displayed, eg "There" (string)
          index: allWordData.length,
        }
      }

      onRecognitionDisconnect = () => {
        listening = false
        if (pauseAfterDisconnect) {
          this.setState({ listening })
        } else {
          this.startListening()
        }
        pauseAfterDisconnect = false
      }

      // TODO might stop getting interim results and handling them if it hurts performance
      updateTranscript = (event) => {
        interimTranscript = ''
        // looks like they iterate over same results every time, rather than gradually compiling as it goes. Could slow things down if transcript gets long TODO
        let newState = {
          // might not need
          allResults: event.results
        }

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            let wordResults = event.results[i][0]
            finalTranscript = this.concatTranscripts(
              finalTranscript,
              wordResults.transcript
            )

            let newWordData = this.newWordData(wordResults)
            //TODO bad practice modifying original object like this!
            let transcriptData = this.state.transcriptData
            transcriptData.words.push(newWordData)
            
            newState.finalTranscript = finalTranscript
            newState.transcriptData = transcriptData

          } else {
            interimTranscript = this.concatTranscripts(
              interimTranscript,
              event.results[i][0].transcript
            )
            newState.interimTranscript = interimTranscript
          }
        }

        this.setState(newState)
      }

      // returns string with all transcript together
      concatTranscripts(...transcriptParts) {
        return transcriptParts.map(t => t.trim()).join(' ').trim()
      }

      resetTranscript = () => {
        interimTranscript = ''
        finalTranscript = ''
        this.disconnect('RESET')
        this.setState({ 
          interimTranscript, 
          finalTranscript,
          transcriptData: newTranscriptData(),
          speechTimerStartedAt: false,
        })
      }

      startListening = () => {
        if (recognition && !listening) {
          try {
            recognition.start()
          } catch (DOMException) {
            // Tried to start recognition after it has already started - safe to swallow this error
          }
          listening = true
          let newState = {listening}
          if (!this.state.speechTimerStartedAt) {
            newState.speechTimerStartedAt = Date.now()
          }

          this.setState(newState)
        }
      }

      abortListening = () => {
        listening = false
        this.setState({ listening })
        this.disconnect('ABORT')
      }

      stopListening = () => {
        listening = false
        this.setState({ listening })
        this.disconnect('STOP')
      }

      render() {
        // includes both
        const transcript = this.concatTranscripts(
          finalTranscript,
          interimTranscript
        )

        const totalTimeElapsed = this.minElapsed()

        return (
          <WrappedComponent
            resetTranscript={this.resetTranscript}
            startListening={this.startListening}
            abortListening={this.abortListening}
            stopListening={this.stopListening}
            transcript={transcript}
            recognition={recognition}
            allResults={this.state.allResults}
            listening={this.state.listening}
            transcriptData={this.state.transcriptData}
            interimTranscript={this.state.interimTranscript}
            finalTranscript={this.state.finalTranscript}
            browserSupportsSpeechRecognition={browserSupportsSpeechRecognition}
            totalTimeElapsed={totalTimeElapsed}
            {...this.props} />
        )
      }
    }
  }

  if (typeof options === 'function') {
    return SpeechRecognitionInner(options)
  } else {
    return SpeechRecognitionInner
  }
}

import React from 'react';
import { render } from 'react-dom';

import { TranscriptEditor, GenerateTranscript } from './lib';

import kaldiTedTalkTranscript from './sample-data/KateDarling_2018S-bbc-kaldi.json';
import style from './index.module.css';
import SttTypeSelect from './select-stt-json-type';
import ExportFormatSelect from './select-export-format';

import hunSenInterviewPart1Transcript from './sample-data/Hun-Sen-interview-part1-transcript-data.json';

const tedTalkVideoUrl = 'https://download.ted.com/talks/KateDarling_2018S-950k.mp4';
const hunSenInterview1Url360px = 'https://av.voanews.com/Videoroot/Pangeavideo/2018/09/4/43/43e10b36-b843-4fea-9a66-1160373adede.mp4?download=1';
const hunSenInterview1Url270px = 'https://av.voanews.com/Videoroot/Pangeavideo/2018/09/4/43/43e10b36-b843-4fea-9a66-1160373adede_mobile.mp4?download=1';
const hunSenInterview2Url360px = 'https://av.voanews.com/Videoroot/Pangeavideo/2018/09/8/85/85b38eb5-a8cc-4ef9-827c-eab331e7f5a2.mp4?download=1';
const hunSenInterview2Url270px = 'https://av.voanews.com/Videoroot/Pangeavideo/2018/09/8/85/85b38eb5-a8cc-4ef9-827c-eab331e7f5a2_mobile.mp4?download=1';
const hunSenInterview3Url360px = 'https://av.voanews.com/Videoroot/Pangeavideo/2018/09/a/af/af67500f-9491-47f6-8e26-1c6f7a3827d6.mp4?download=1';
const hunSenInterview3Url270px = 'https://av.voanews.com/Videoroot/Pangeavideo/2018/09/a/af/af67500f-9491-47f6-8e26-1c6f7a3827d6_mobile.mp4?download=1';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      transcriptData: null,
      mediaUrl: null,
      isTextEditable: true,
      sttType: 'bbckaldi',
      analyticsEvents: [],
      fileName: 'Khmer Transcript Data',
      playingWhileListening: false,
    };

    this.transcriptEditorRef = React.createRef();
    this.startListeningAndPlayingMedia = this.startListeningAndPlayingMedia.bind(this)
  }

  loadDemo() {
    this.setState({
      transcriptData: hunSenInterviewPart1Transcript,
      mediaUrl: hunSenInterview1Url360px,
      sttType: 'bbckaldi',
      fileName: 'Hun Sen interview part1 transcript data',
    });
  }

  startListeningAndPlayingMedia(e) {
    this.setState({playingWhileListening: true})
  }

  // https://stackoverflow.com/questions/8885701/play-local-hard-drive-video-file-with-html5-video-tag
  handleChangeLoadMedia(files) {
    console.log(files);
    const file = files[0];
    const type = file.type;
    // check if is playable
    const videoNode = document.createElement('video');
    const canPlay = videoNode.canPlayType(type);
    if (canPlay) {
      const fileURL = URL.createObjectURL(file);
      // videoNode.src = fileURL
      this.setState({
        // transcriptData: kaldiTedTalkTranscript,
        mediaUrl: fileURL,
        fileName: file.name
      });
    }
    else {
      alert('select a valid audio or video file');
    }
  }

  handleChangeLoadMediaUrl() {
    const fileURL = prompt("Paste the URL you'd like to use here");

    this.setState({
      // transcriptData: kaldiTedTalkTranscript,
      mediaUrl: fileURL,
    });
  }

  handleChangeLoadTranscriptJson(files) {
    const file = files[0];

    if (file.type ==='application/json') {
      const fr = new FileReader();

      fr.onload = (evt) => {
        this.setState({
          transcriptData: JSON.parse(evt.target.result)
        });
      };

      fr.readAsText(file);

    }
    else {
      alert('select a valid json file');
    }
  }

  handleIsTextEditable = () => {
    this.setState((prevState) => ({ isTextEditable: (prevState.isTextEditable) !== true }));
  }

  // https://stackoverflow.com/questions/21733847/react-jsx-selecting-selected-on-selected-select-option
  handleSttTypeChange = (event) => {
    console.log(event.target.name, event.target.value);
    this.setState({ [event.target.name]: event.target.value });
  }

  handleExportFormatChange = (event) => {
    console.log(event.target.name, event.target.value);
    this.setState({ [event.target.name]: event.target.value });
  }

  exportTranscript = () => {
    // eslint-disable-next-line react/no-string-refs
    const { data, ext } = this.transcriptEditorRef.current.getEditorContent(this.state.exportFormat);
    this.download(data, `${ this.state.mediaUrl }.${ ext }`);
  }

  // https://stackoverflow.com/questions/2897619/using-html5-javascript-to-generate-and-save-a-file
  download = (content, filename, contentType) => {
    const type = contentType || 'application/octet-stream';
    const a = document.createElement('a');
    const blob = new Blob([ content ], { type: type });

    a.href = window.URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }

   clearLocalStorage = () => {
     localStorage.clear();
     console.info('cleared local storage');
   }

   handleAnalyticsEvents = (event) => {
     this.setState({ analyticsEvents: [ ...this.state.analyticsEvents, event ] });
   }

   handleChangeTranscriptName = (value) => {
     this.setState({ fileName: value });
   }

   playMedia
   render() {
     return (
       <div className={ style.container }>
         <span className={ style.title }>
            Demo page for <mark>Khmer Transcript Creator</mark> - Component |&nbsp;
           <a
             href="https://github.com/RyanQuey/react-transcript-editor"
             rel="noopener noreferrer"
             target="_blank"
           >
            Github Repo
           </a>
         </span>
         <GenerateTranscript
           download = { this.download }
           fileName = {this.state.fileName}
           playingWhileListening = { this.state.playingWhileListening }
         />
         <br />
         <button onClick={ () => this.loadDemo() }>load demo</button>
         <hr />
         <label>Load Local Audio or Video Media:&nbsp;</label>
         <input
           type="file"
           onChange={ e => this.handleChangeLoadMedia(e.target.files) }
         />
         or&nbsp;
         <button onClick={ () => this.handleChangeLoadMediaUrl() }>
          Load Media From Url
         </button>
         <br/>
         <label>Transcript Json Format:&nbsp;</label>
         <SttTypeSelect
           name={ 'sttType' }
           value={ this.state.sttType }
           handleChange={ this.handleSttTypeChange }
         />
         &nbsp;&nbsp;
         <label>Transcript Json:&nbsp;</label>
         <input
           type="file"
           onChange={ e => this.handleChangeLoadTranscriptJson(e.target.files) }
         />
         <br />

         <label>Text Is Editable</label>
         <label className={ style.switch }>
           <input type="checkbox"
             defaultChecked="true"
             onChange={ this.handleIsTextEditable }
           />
           <span className={ style.slider }></span>
         </label>
         <br />

         <label>Transcript Name</label>
         <input
           type="text"
           onChange={ e => this.handleChangeTranscriptName(e.target.value) }
           value={ this.state.fileName }
         />
         <br />

         <label>Export Edited Transcript:&nbsp;</label>
         <button onClick={ () => this.exportTranscript() }>Export</button>

         <ExportFormatSelect
           name={ 'exportFormat' }
           value={ this.state.exportFormat }
           handleChange={ this.handleExportFormatChange }
         />
         <br />

         <button onClick={ () => this.clearLocalStorage() }>Clear Local Storage</button>
         {this.state.mediaUrl &&
           <button onClick={ () => this.startListeningAndPlayingMedia() }>Generate Transcript from Media</button>
         }
         <hr/>

         <TranscriptEditor
           transcriptData = { this.state.transcriptData }
           fileName = { this.state.fileName }
           mediaUrl = { this.state.mediaUrl }
           isEditable = { this.state.isTextEditable }
           sttJsonType = { this.state.sttType }
           handleAnalyticsEvents = { this.handleAnalyticsEvents }
           ref = { this.transcriptEditorRef }
           playingWhileListening = { this.state.playingWhileListening }
         />
         <hr/>

         { false && "TODO not worrying about right now" && <div>
           <label>Components Analytics</label>
           <textarea
             style={ { height: '200px', width: '100%' } }
             value={ JSON.stringify(this.state.analyticsEvents, null, 2) }
             disabled>
           </textarea>
         </div> }
       </div>
     );
   }
}

render(<App />, document.getElementById('root'));

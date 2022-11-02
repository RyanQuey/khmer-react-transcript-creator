import React from "react";
import { render } from "react-dom";

import { TranscriptEditor, GenerateTranscript } from "./lib";

import kaldiTedTalkTranscript from "./sample-data/KateDarling_2018S-bbc-kaldi.json";
import khmerRougeTranscript from "./sample-data/khmer-rouge-interview-data.json";
import style from "./index.module.css";
import SttTypeSelect from "./select-stt-json-type";
import ExportFormatSelect from "./select-export-format";

// import khmerRougeInterviewTranscript from './sample-data/khmer-rouge-interview-transcript-data.json';

const tedTalkVideoUrl =
  "https://download.ted.com/talks/KateDarling_2018S-950k.mp4";
const khmerRougeInterviewTranscript =
  "https://av.voanews.com/Videoroot/Pangeavideo/2019/01/b/b8/b83b37e5-3deb-4668-9daa-b2837648799f.mp4?download=1"; // 360px (270, 720, and 1080 available)

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      transcriptData: null,
      mediaUrl: null,
      isTextEditable: true,
      sttType: "bbckaldi",
      analyticsEvents: [],
      fileName: "Khmer Transcript Data",
      playingWhileListening: false,
    };

    this.transcriptEditorRef = React.createRef();
    this.startListeningAndPlayingMedia = this.startListeningAndPlayingMedia.bind(
      this
    );
  }

  loadDemo() {
    this.setState({
      transcriptData: khmerRougeTranscript,
      mediaUrl: khmerRougeInterviewTranscript,
      sttType: "bbckaldi",
      fileName: "transcript-data",
    });
  }

  startListeningAndPlayingMedia(e) {
    this.setState({ playingWhileListening: true });
  }

  // https://stackoverflow.com/questions/8885701/play-local-hard-drive-video-file-with-html5-video-tag
  handleChangeLoadMedia(files) {
    console.log(files);
    const file = files[0];
    const type = file.type;
    // check if is playable
    const videoNode = document.createElement("video");
    const canPlay = videoNode.canPlayType(type);
    if (canPlay) {
      const fileURL = URL.createObjectURL(file);
      // videoNode.src = fileURL
      this.setState({
        // transcriptData: kaldiTedTalkTranscript,
        mediaUrl: fileURL,
        fileName: file.name,
      });
    } else {
      alert("select a valid audio or video file");
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

    if (file.type === "application/json") {
      const fr = new FileReader();

      fr.onload = (evt) => {
        this.setState({
          transcriptData: JSON.parse(evt.target.result),
        });
      };

      fr.readAsText(file);
    } else {
      alert("select a valid json file");
    }
  }

  handleIsTextEditable = () => {
    this.setState((prevState) => ({
      isTextEditable: prevState.isTextEditable !== true,
    }));
  };

  // https://stackoverflow.com/questions/21733847/react-jsx-selecting-selected-on-selected-select-option
  handleSttTypeChange = (event) => {
    console.log(event.target.name, event.target.value);
    this.setState({ [event.target.name]: event.target.value });
  };

  handleExportFormatChange = (event) => {
    console.log(event.target.name, event.target.value);
    this.setState({ [event.target.name]: event.target.value });
  };

  exportTranscript = () => {
    // eslint-disable-next-line react/no-string-refs
    const { data, ext } = this.transcriptEditorRef.current.getEditorContent(
      this.state.exportFormat
    );
    this.download(data, `${this.state.mediaUrl}.${ext}`);
  };

  // https://stackoverflow.com/questions/2897619/using-html5-javascript-to-generate-and-save-a-file
  download = (content, filename, contentType) => {
    const type = contentType || "application/octet-stream";
    const a = document.createElement("a");
    const blob = new Blob([content], { type: type });

    a.href = window.URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  };

  clearLocalStorage = () => {
    localStorage.clear();
    console.info("cleared local storage");
  };

  handleAnalyticsEvents = (event) => {
    this.setState({ analyticsEvents: [...this.state.analyticsEvents, event] });
  };

  handleChangeTranscriptName = (value) => {
    this.setState({ fileName: value });
  };

  playMedia;
  render() {
    return (
      <div className={style.container}>
        <span className={style.title}>
          Demo page for <mark>Khmer Transcript Creator</mark> - Component
          |&nbsp;
          <a
            href="https://github.com/RyanQuey/khmer-react-transcript-creator"
            rel="noopener noreferrer"
            target="_blank"
          >
            Github Repo
          </a>
        </span>
        <GenerateTranscript />
      </div>
    );
  }
}

render(<App />, document.getElementById("root"));

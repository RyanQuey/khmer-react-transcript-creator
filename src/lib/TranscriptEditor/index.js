import React from 'react';
import PropTypes from 'prop-types';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faKeyboard } from '@fortawesome/free-solid-svg-icons';

import TimedTextEditor from './TimedTextEditor';
import MediaPlayer from './MediaPlayer';
import Settings from './Settings';
import Shortcuts from './Settings/Shortcuts';
import { secondsToTimecode } from '../Util/timecode-converter/index';

import style from './index.module.css';

const urlParams = new URLSearchParams(window.location.search);

class TranscriptEditor extends React.Component {
  constructor(props) {
    super(props);

    let startTime = urlParams.has('startTime') ? parseFloat(urlParams.get('startTime')) : 0;
    if (isNaN(startTime)) {
      startTime = 0
    }

    this.state = {
      defaultStartTime: startTime,
      currentTime: startTime,
      lastLocalSavedTime: '',
      transcriptData: null,
      isScrollIntoViewOn: true,
      showSettings: false,
      showShortcuts: false,
      isPauseWhileTypingOn: true,
      rollBackValueInSeconds: 5,
      timecodeOffset: 0,
      showTimecodes: true,
      showSpeakers: true
    };
    this.timedTextEditorRef = React.createRef();
  }

  static getDerivedStateFromProps(nextProps) {
    if (nextProps.transcriptData !== null) {
      return {
        transcriptData: nextProps.transcriptData
      };
    }

    return null;
  }

  componentDidUpdate(prevProps, prevState) {
    // Transcript and media passed to component at same time
    if (
      (prevState.transcriptData !== this.state.transcriptData)
        && (prevProps.mediaUrl !== this.props.mediaUrl )
    ) {
      console.info('Transcript and media');
      this.ifPresentRetrieveTranscriptFromLocalStorage();
    }
    // Transcript first and then media passed to component
    else if (
      (prevState.transcriptData === this.state.transcriptData)
      && (prevProps.mediaUrl !== this.props.mediaUrl)
    ) {
      console.info('Transcript first and then media');
      this.ifPresentRetrieveTranscriptFromLocalStorage();
    }
    // Media first and then transcript passed to component
    else if (
      (prevState.transcriptData !== this.state.transcriptData)
      && (prevProps.mediaUrl === this.props.mediaUrl)
    ) {
      console.info('Media first and then transcript');
      this.ifPresentRetrieveTranscriptFromLocalStorage();
    }
  }

  ifPresentRetrieveTranscriptFromLocalStorage = () => {
    // if (this.timedTextEditorRef.current!== undefined) {
    if (this.timedTextEditorRef.current) {
      if (this.timedTextEditorRef.current.isPresentInLocalStorage(this.props.mediaUrl)) {
        console.info('was already present in local storage');
        this.timedTextEditorRef.current.loadLocalSavedData(this.props.mediaUrl);
      } else {
        console.info('not present in local storage');
      }
    }
  }

  // eslint-disable-next-line class-methods-use-this
  // when double click a single word
    /* handleWordClick = (startTime) => {
    if (this.props.handleAnalyticsEvents !== undefined) {
      this.props.handleAnalyticsEvents({
        category: 'TranscriptEditor',
        action: 'doubleClickOnWord',
        name: 'startTime',
        value: secondsToTimecode(startTime)
      });
    }

    this.jumpToHere(startTime)
  }*/

  handleJumpToHereClick = (startTime) => {
    this.jumpToHere(startTime)
  }

  jumpToHere = (startTime) => {
    // TODO add analytics stuff...except I don't care right now haha

    // happens if the data gets messed up and they click on a paragraph that has that faulty data
    // TODO allow editing timing so this can get fixed
    if ([ NaN, undefined ].includes(startTime)) {
      console.error("startTime cannot be set to be NaN or undefined");

      return
    }
    this.setCurrentTime(startTime);
  }

  // eslint-disable-next-line class-methods-use-this
  handleTimeUpdate = (currentTime) => {
    this.setState({
      currentTime,
    });
  }

  handlePlayMedia = (bool) => {
    this.playMedia(null, bool);
  }

  handleIsPlaying = () => {
    return this.isPlaying();
  }

  handleIsScrollIntoViewChange = (e) => {
    const isChecked = e.target.checked;
    this.setState({ isScrollIntoViewOn: isChecked });

    if (this.props.handleAnalyticsEvents !== undefined) {
      this.props.handleAnalyticsEvents({
        category: 'TranscriptEditor',
        action: 'handleIsScrollIntoViewChange',
        name: 'isScrollIntoViewOn',
        value: isChecked
      });
    }

  }
  handlePauseWhileTyping = (e) => {
    const isChecked = e.target.checked;
    this.setState({ isPauseWhileTypingOn: isChecked });

    if (this.props.handleAnalyticsEvents !== undefined) {
      this.props.handleAnalyticsEvents({
        category: 'TranscriptEditor',
        action: 'handlePauseWhileTyping',
        name: 'isPauseWhileTypingOn',
        value: isChecked
      });
    }
  }

  handleRollBackValueInSeconds = (e) => {
    const rollBackValue = e.target.value;
    this.setState({ rollBackValueInSeconds: rollBackValue });

    if (this.props.handleAnalyticsEvents !== undefined) {
      this.props.handleAnalyticsEvents({
        category: 'TranscriptEditor',
        action: 'handleRollBackValueInSeconds',
        name: 'rollBackValueInSeconds',
        value: rollBackValue
      });
    }
  }

  handleSetTimecodeOffset = (timecodeOffset) => {

    this.setState({ timecodeOffset: timecodeOffset },
      () => {
        // eslint-disable-next-line react/no-string-refs
        this.timedTextEditorRef.current.forceUpdate();
      });
  }

  handleShowTimecodes = (e) => {
    const isChecked = e.target.checked;
    this.setState({ showTimecodes: isChecked });

    if (this.props.handleAnalyticsEvents !== undefined) {
      this.props.handleAnalyticsEvents({
        category: 'TranscriptEditor',
        action: 'handleShowTimecodes',
        name: 'showTimecodes',
        value: isChecked
      });
    }
  }

  handleShowSpeakers = (e) => {
    const isChecked = e.target.checked;
    this.setState({ showSpeakers: isChecked });

    if (this.props.handleAnalyticsEvents !== undefined) {
      this.props.handleAnalyticsEvents({
        category: 'TranscriptEditor',
        action: 'handleShowSpeakers',
        name: 'showSpeakers',
        value:  isChecked
      });
    }
  }

  handleSettingsToggle = () => {
    this.setState(prevState => ({
      showSettings: !prevState.showSettings
    }));

    if (this.props.handleAnalyticsEvents !== undefined) {
      this.props.handleAnalyticsEvents({
        category: 'TranscriptEditor',
        action: 'handleSettingsToggle',
        name: 'showSettings',
        value:  !this.state.showSettings
      });
    }
  }

  handleShortcutsToggle = () => {
    this.setState(prevState => ({
      showShortcuts: !prevState.showShortcuts
    }));

    if (this.props.handleAnalyticsEvents !== undefined) {
      this.props.handleAnalyticsEvents({
        category: 'TranscriptEditor',
        action: 'handleShortcutsToggle',
        name: 'showShortcuts',
        value:  !this.state.showShortcuts
      });
    }
  }

  getEditorContent = (exportFormat) => {
    return this.timedTextEditorRef.current.getEditorContent(exportFormat);
  }

  handleSaveTranscript = () => {
    return this.timedTextEditorRef.current.localSave(this.props.mediaUrl);
  }

  render() {
    const mediaPlayer = <MediaPlayer
      fileName={ this.props.fileName }
      hookSeek={ foo => this.setCurrentTime = foo }
      hookPlayMedia={ foo => this.playMedia = foo }
      hookIsPlaying={ foo => this.isPlaying = foo }
      rollBackValueInSeconds={ this.state.rollBackValueInSeconds }
      timecodeOffset={ this.state.timecodeOffset }
      hookOnTimeUpdate={ this.handleTimeUpdate }
      mediaUrl={ this.props.mediaUrl }
      // ref={ 'MediaPlayer' }
      handleAnalyticsEvents={ this.props.handleAnalyticsEvents }
      handleSaveTranscript={ this.handleSaveTranscript }
      playingWhileListening = { this.props.playingWhileListening }
      timedTextEditorRef = { this.timedTextEditorRef.current }
      defaultStartTime = { this.state.defaultStartTime } 
    />;

    const settings = <Settings
      handleSettingsToggle={ this.handleSettingsToggle }
      defaultValuePauseWhileTyping={ this.state.isPauseWhileTypingOn }
      defaultValueScrollSync={ this.state.isScrollIntoViewOn }
      defaultRollBackValueInSeconds={ this.state.rollBackValueInSeconds }
      timecodeOffset={ this.state.timecodeOffset }
      showTimecodes={ this.state.showTimecodes }
      showSpeakers={ this.state.showSpeakers }
      handlePauseWhileTyping={ this.handlePauseWhileTyping }
      handleIsScrollIntoViewChange={ this.handleIsScrollIntoViewChange }
      handleRollBackValueInSeconds={ this.handleRollBackValueInSeconds }
      handleSetTimecodeOffset={ this.handleSetTimecodeOffset }
      handleShowTimecodes={ this.handleShowTimecodes }
      handleShowSpeakers={ this.handleShowSpeakers }
      handleAnalyticsEvents={ this.props.handleAnalyticsEvents }
    />;

    const shortcuts = <Shortcuts
      handleShortcutsToggle={ this.handleShortcutsToggle }
    />;

    const timedTextEditor = <TimedTextEditor
      fileName={ this.props.fileName }
      transcriptData={ this.state.transcriptData }
      timecodeOffset={ this.state.timecodeOffset }
      onWordClick={ this.handleWordClick }
      onJumpToHereClick={ this.handleJumpToHereClick }
      playMedia={ this.handlePlayMedia }
      isPlaying={ this.handleIsPlaying }
      currentTime={ this.state.currentTime }
      isEditable={ this.props.isEditable }
      sttJsonType={ this.props.sttJsonType }
      mediaUrl={ this.props.mediaUrl }
      isScrollIntoViewOn={ this.state.isScrollIntoViewOn }
      isPauseWhileTypingOn={ this.state.isPauseWhileTypingOn }
      showTimecodes={ this.state.showTimecodes }
      showSpeakers={ this.state.showSpeakers }
      ref={ this.timedTextEditorRef }
      handleAnalyticsEvents={ this.props.handleAnalyticsEvents }
    />;

    return (
      <div className={ style.container }>
        <header className={ style.header }>
          { this.state.showSettings ? settings : null }
          { this.state.showShortcuts ? shortcuts : null }
        </header>

        <aside className={ style.aside }>{ this.props.mediaUrl ? mediaPlayer : null }</aside>

        <div className={ style.settingsContainer }>
          <button className={ style.settingsButton } onClick={ this.handleSettingsToggle }>
            <FontAwesomeIcon icon={ faCog } />
          </button>
          <button className={ style.settingsButton } onClick={ this.handleShortcutsToggle }>
            <FontAwesomeIcon icon={ faKeyboard } />
          </button>
        </div>

        <main className={ style.main }>
          {this.props.mediaUrl === null? null : timedTextEditor}
        </main>
      </div>
    );
  }
}

TranscriptEditor.propTypes = {
  mediaUrl: PropTypes.string,
  isEditable: PropTypes.bool,
  sttJsonType: PropTypes.string,
  handleAnalyticsEvents: PropTypes.func,
  fileName: PropTypes.string
};

export default TranscriptEditor;

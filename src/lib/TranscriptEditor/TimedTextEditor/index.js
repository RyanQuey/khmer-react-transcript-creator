import React from 'react';
import PropTypes from 'prop-types';
import Tooltip from 'react-simple-tooltip';
import { Map, List, fromJS } from 'immutable'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle, faMousePointer, faICursor, faUserEdit, faKeyboard, faSave, faShareSquare } from '@fortawesome/free-solid-svg-icons';

import {
  Editor,
  EditorState,
  CompositeDecorator,
  convertFromRaw,
  convertToRaw,
  getDefaultKeyBinding,
  Modifier,
  KeyBindingUtil,
  SelectionState,
} from 'draft-js';

import Word from './Word';
import WrapperBlock from './WrapperBlock';

import sttJsonAdapter from '../../Util/adapters/index.js';
import exportAdapter from '../../Util/export-adapters/index.js';
import style from './index.module.css';

const { hasCommandModifier } = KeyBindingUtil;

class TimedTextEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      editorState: EditorState.createEmpty(),
      transcriptData: this.props.transcriptData,
      isEditable: this.props.isEditable,
      sttJsonType: this.props.sttJsonType,
      timecodeOffset: this.props.timecodeOffset,
      showSpeakers: this.props.showSpeakers,
      showTimecodes: this.props.showTimecodes,
      // inputCount: 0,
      currentWord: {},
      settingTimecodeFor: null,
    };
  }

  componentDidMount() {
    this.loadData();
  }

  static getDerivedStateFromProps(nextProps) {
    if (nextProps.transcriptData !== null) {

      return {
        transcriptData: nextProps.transcriptData,
        isEditable: nextProps.isEditable,
        timecodeOffset: nextProps.timecodeOffset,
        showSpeakers: nextProps.showSpeakers,
        showTimecodes: nextProps.showTimecodes
      };
    }

    return null;
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      (prevState.transcriptData !== this.state.transcriptData)
      && ( this.props.mediaUrl!== null && !this.isPresentInLocalStorage(this.props.mediaUrl) )
    ) {
      this.loadData();
    }
    if (prevState.timecodeOffset !== this.state.timecodeOffset
      || prevState.showSpeakers !== this.state.showSpeakers
      || prevState.showTimecodes !== this.state.showTimecodes) {
      // forcing a re-render is an expensive operation and
      // there might be a way of optimising this at a later refactor (?)
      // the issue is that WrapperBlock is not update on TimedTextEditor
      // state change otherwise.
      // for now compromising on this, as setting timecode offset, and
      // display preferences for speakers and timecodes are not expected to
      // be very frequent operations but rather one time setup in most cases.
      this.forceRenderDecorator();
    }
  }

  onChange = (editorState) => {
    // https://draftjs.org/docs/api-reference-editor-state#lastchangetype
    // https://draftjs.org/docs/api-reference-editor-change-type
    // doing editorStateChangeType === 'insert-characters'  is triggered even
    // outside of draftJS eg when clicking play button so using this instead
    // see issue https://github.com/facebook/draft-js/issues/1060
    if (this.state.editorState.getCurrentContent() !== editorState.getCurrentContent()) {
      if (this.props.isPauseWhileTypingOn) {
        if (this.props.isPlaying()) {
          this.props.playMedia(false);
          // Pause video for X seconds
          /*  NOTE trying it without auto-resume, for better control and maybe less clunky UI
          const pauseWhileTypingIntervalInMilliseconds = 4*1000;
          // resets timeout
          clearTimeout(this.pauseWhileTypingTimeOut);
          this.pauseWhileTypingTimeOut = setTimeout(function() {
            // after timeout starts playing again
            this.props.playMedia(true);
          }.bind(this), pauseWhileTypingIntervalInMilliseconds);
          */ 
        }
      }

      /*
      // trying to keep length to whole block, including latest additions
      const contentState = editorState.getCurrentContent();
      const blockKey = contentState.getSelectionAfter().getStartKey() // TODO maybe should be getSelectionAfter
      const currentBlock = contentState.getBlockForKey(blockKey)
      const entityKey = this.findEntityKeyForBlock(currentBlock)
      contentState.mergeEntityData(entityKey, {
        offset: 0,
        length: currentBlock.getText().length
      })
      */
    }

    if (this.state.isEditable) {
      this.setState(() => ({
        editorState
      }), () => {
        // saving when user has stopped typing for more then five seconds
        if (this.saveTimer!== undefined) {
          clearTimeout(this.saveTimer);
        }
        this.saveTimer = setTimeout(() => {
          this.localSave(this.props.mediaUrl);
        }, 1000);
      });
    }

  }

  // helper for getting the entity for the block
  // apparently there's no better way.. https://github.com/facebook/draft-js/issues/1681
  /*
  findEntityKeyForBlock = (block) => {
    let entity
    for (var i = 0; i < block.getText().length; i++) {
      entity = block.getEntityAt(i)
      if (entity) {
        break
      }
    }
  
    return entity
  } */

  loadData() {
    if (this.props.transcriptData !== null) {
      const blocks = sttJsonAdapter(this.props.transcriptData, this.props.sttJsonType);
      if (blocks.blocks.length === 0) {
        console.error("No Blocks returned!")
        alert("No Blocks returned!")

        // TODO this still breaks but allows user to continue doing some stuff at least...
        // probably want better error handling
        return 
      }
      this.setEditorContentState(blocks);
    }
  }

  getEditorContent(exportFormat) {
    const format = exportFormat || 'draftjs';

    return exportAdapter(convertToRaw(this.state.editorState.getCurrentContent()), format);
  }

  // click on words - for navigation
  // eslint-disable-next-line class-methods-use-this
  handleDoubleClick = (event) => {
    // nativeEvent --> React giving you the DOM event
    let element = event.nativeEvent.target;
    // find the parent in Word that contains span with time-code start attribute
    while (!element.hasAttribute('data-start') && element.parentElement) {
      element = element.parentElement;
    }

    if (element.hasAttribute('data-start')) {
      const t = parseFloat(element.getAttribute('data-start'));
      this.props.onWordClick(t);
    }
  }

  localSave = () => {
    console.log('localSave');
    clearTimeout(this.saveTimer);
    let mediaUrlName = this.props.mediaUrl;
    // if using local media instead of using random blob name
    // that makes it impossible to retrieve from on page refresh
    // use file name
    if (this.props.mediaUrl.includes('blob')) {
      mediaUrlName = this.props.fileName;
    }

    const data = convertToRaw(this.state.editorState.getCurrentContent());
    localStorage.setItem(`draftJs-${ mediaUrlName }`, JSON.stringify(data));
    const newLastLocalSavedDate = new Date().toString();
    localStorage.setItem(`timestamp-${ mediaUrlName }`, newLastLocalSavedDate);

    // return newLastLocalSavedDate;
  }

  // eslint-disable-next-line class-methods-use-this
  isPresentInLocalStorage(mediaUrl) {
    if (mediaUrl !== null) {
      let mediaUrlName = mediaUrl;

      if (mediaUrl.includes('blob')) {
        mediaUrlName = this.props.fileName;
      }

      const data = localStorage.getItem(`draftJs-${ mediaUrlName }`);
      if (data !== null) {
        return true;
      }

      return false;
    }

    return false;
  }

  loadLocalSavedData(mediaUrl) {
    let mediaUrlName = mediaUrl;
    if (mediaUrl.includes('blob')) {
      mediaUrlName = this.props.fileName;
    }
    const data = JSON.parse(localStorage.getItem(`draftJs-${ mediaUrlName }`));
    if (data !== null) {
      const lastLocalSavedDate = localStorage.getItem(`timestamp-${ mediaUrlName }`);
      this.setEditorContentState(data);

      return lastLocalSavedDate;
    }

    return '';
  }

  // originally from
  // https://github.com/draft-js-plugins/draft-js-plugins/blob/master/draft-js-counter-plugin/src/WordCounter/index.js#L12
  getWordCount = (editorState) => {
    const plainText = editorState.getCurrentContent().getPlainText('');
    const regex = /(?:\r\n|\r|\n)/g; // new line, carriage return, line feed
    const cleanString = plainText.replace(regex, ' ').trim(); // replace above characters w/ space
    const wordArray = cleanString.match(/\S+/g); // matches words according to whitespace

    return wordArray ? wordArray.length : 0;
  }

  /**
  * @param {object} data.entityMap - draftJs entity maps - used by convertFromRaw
  * @param {object} data.blocks - draftJs blocks - used by convertFromRaw
  * set DraftJS Editor content state from blocks
  * contains blocks and entityMap
  */
  setEditorContentState = (data) => {
    if (!data || !data.blocks.length) {
      console.error("No data given!")
    }
    const contentState = convertFromRaw(data);
    // eslint-disable-next-line no-use-before-define
    const editorState = EditorState.createWithContent(contentState); // , decorator);

    if (this.props.handleAnalyticsEvents !== undefined) {
      this.props.handleAnalyticsEvents({
        category: 'TimedTextEditor',
        action: 'setEditorContentState',
        name: 'getWordCount',
        value: this.getWordCount(editorState)
      });
    }

    this.setState({ editorState });
  }

  // Helper function to re-render this component
  // used to re-render WrapperBlock on timecode offset change
  // or when show / hide preferences for speaker labels and timecodes change
  // RQ: trying without decorator for speed 
  forceRenderDecorator = () => {
    // const { editorState, updateEditorState } = this.props;
    const contentState = this.state.editorState.getCurrentContent();
    // const decorator = this.state.editorState.getDecorator();

    const newState = EditorState.createWithContent(
      contentState,
      // decorator
    );

    // this.setEditorNewContentState(newState);
    const newEditorState = EditorState.push(newState, contentState);
    this.setState({ editorState: newEditorState });
  }

  /**
  * Update Editor content state
  */
  setEditorNewContentState = (newContentState) => {
    const newEditorState = EditorState.push(this.state.editorState, newContentState);
    this.setState({ editorState: newEditorState });

    return newEditorState
  }

  /**
   * Listen for draftJs custom key bindings
   */
  customKeyBindingFn = (e) => {
    const enterKey = 13;
    const spaceKey =32;
    const kKey = 75;
    const lKey = 76;
    const jKey = 74;
    const equalKey = 187;//used for +
    const minusKey = 189; // -
    const rKey = 82;
    const tKey = 84;

    if (e.keyCode === enterKey ) {
      return 'split-paragraph';
    }
    // TODO add in the hotkeys I have
    // if alt key is pressed in combination with these other keys
    if (e.altKey && ((e.keyCode === spaceKey)
    || (e.keyCode === spaceKey)
    || (e.keyCode === kKey)
    || (e.keyCode === lKey)
    || (e.keyCode === jKey)
    || (e.keyCode === equalKey)
    || (e.keyCode === minusKey)
    || (e.keyCode === rKey)
    || (e.keyCode === tKey))
    ) {
      e.preventDefault();

      return 'keyboard-shortcuts';
    }

    return getDefaultKeyBinding(e);
  }

  /**
   * Handle draftJs custom key commands
   */
  handleKeyCommand = (command) => {
    if (command === 'split-paragraph') {
      this.splitParagraph();
    }

    if (command === 'keyboard-shortcuts') {
      return 'handled';
    }

    return 'not-handled';
  }

  /**
   * Helper function to handle splitting paragraphs with return key
   * on enter key, perform split paragraph at selection point.
   * Add timecode of next word after split to paragraph
   * as well as speaker name to new paragraph
   */
  splitParagraph = () => {
    // https://github.com/facebook/draft-js/issues/723#issuecomment-367918580
    // https://draftjs.org/docs/api-reference-selection-state#start-end-vs-anchor-focus
    const currentSelection = this.state.editorState.getSelection();
    // only perform if selection is not selecting a range of words
    // in that case, we'd expect delete + enter to achieve same result.
    if (currentSelection.isCollapsed()) {
      if (this.props.isPauseWhileTypingOn) {
        if (this.props.isPlaying()) {
          this.props.playMedia(false);
        }
      }
      const currentContent = this.state.editorState.getCurrentContent();
      // https://draftjs.org/docs/api-reference-modifier#splitblock
      const newContentState = Modifier.splitBlock(currentContent, currentSelection);
      // https://draftjs.org/docs/api-reference-editor-state#push
      // splitState is new editor state after the push
      const splitState = EditorState.push(this.state.editorState, newContentState, 'split-block');
      const targetSelection = splitState.getSelection();

      const originalBlock = currentContent.blockMap.get(newContentState.selectionBefore.getStartKey());
      const originalBlockData = originalBlock.getData();
      const blockSpeaker = originalBlockData.get('speaker');
      const blockStartTime = originalBlockData.get('start');
      const currentWord = this.getCurrentWord(false)
      const originalIsCurrent = currentWord.start == blockStartTime

      const wordStartTime = blockStartTime;

      // split paragraph
      // https://draftjs.org/docs/api-reference-modifier#mergeblockdata

      // adding words data too
      // starts with same worddata, and then replace the 'word' and 'punct' keys
      let wordsDataForNew = originalBlockData.get('words') || [ {} ];
      // TODO make everything just normal JS, not immutable. Unless decide to move everything to imutable
      if (!Map.isMap(wordsDataForNew)) {
        wordsDataForNew = fromJS(wordsDataForNew);
      }
      const newBlock = newContentState.getBlockAfter(originalBlock.getKey());
      // TODO make everything just normal JS, not immutable. Unless decide to move everything to imutable

      // TODO make an option later. But for now, default is if splitting a block that is currently playing in the audio, make the new start time the current media time
      const newStartTime = originalIsCurrent ? this.props.currentTime : wordStartTime;

      // make word and punct just the new words and punct
      wordsDataForNew = wordsDataForNew
        .setIn([ 0, 'word' ], newBlock.getText())
        .setIn([ 0, 'punct' ], newBlock.getText())
        .setIn([ 0, 'start' ], newStartTime);

      let wordsDataForOld = originalBlockData.get('words') || [ {} ];
      // if (!List.isList(wordsDataForOld) || !Map.isMap(wordsDataForOld)) {
      // TODO make everything just normal JS, not immutable. Unless decide to move everything to imutable
      if (!Map.isMap(wordsDataForOld)) {
        wordsDataForOld = fromJS(wordsDataForOld);
      }
      const wordsLeft = originalBlock.getText().slice(0, - (newBlock.getText().length));
      wordsDataForOld = wordsDataForOld.setIn([ 0, 'word' ], wordsLeft)
        .setIn([ 0, 'end' ], newStartTime)
        .setIn([ 0, 'punct' ], wordsLeft);

      // add the new block (the third arg) into draft js
      const afterMergeContentState = Modifier.mergeBlockData(
        splitState.getCurrentContent(),
        targetSelection,
        {
          'start': newStartTime,
          'speaker': blockSpeaker,
          'words': wordsDataForNew,
        }
      );
      const newestEditorState = this.setEditorNewContentState(afterMergeContentState);

      // update old transcript word and punct

      const afterMergeContentState2 = Modifier.mergeBlockData(
        newestEditorState.getCurrentContent(),
        SelectionState.createEmpty(originalBlock.getKey()),
        {
          'words': wordsDataForOld,
        }
      );
      this.setEditorNewContentState(afterMergeContentState2);


      return 'handled';
    }

    return 'not-handled';
  }

  /**
   * Helper function for splitParagraph
   * to find the closest entity (word) to a selection point
   * that does not fall on an entity to begin with
   * Looks before if it's last char in a paragraph block.
   * After for everything else.
   */
    /*
  findClosestEntityKeyToSelectionPoint = (currentSelection, originalBlock) => {
    // set defaults
    let entityKey = null;
    let isEndOfParagraph = false;

    // selection offset from beginning of the paragraph block
    const startSelectionOffsetKey = currentSelection.getStartOffset();
    // length of the plain text for the ContentBlock
    const lengthPlainTextForTheBlock = originalBlock.getLength();
    // number of char from selection point to end of paragraph
    const remainingCharNumber = lengthPlainTextForTheBlock - startSelectionOffsetKey;
    // if it's the last char in the paragraph - get previous entity
    if (remainingCharNumber === 0 ) {
      isEndOfParagraph = true;
      for (let j = lengthPlainTextForTheBlock; j >0 ; j--) {
        entityKey = originalBlock.getEntityAt(j);
        if (entityKey!== null) {
          // if it finds it then return
          return { entityKey, isEndOfParagraph };
        }
      }
    }
    // if it's first char or another within the block - get next entity
    else {
      console.log('Main part of paragraph');
      let initialSelectionOffset = currentSelection.getStartOffset();
      for (let i = 0; i < remainingCharNumber ; i++) {
        initialSelectionOffset +=i;
        entityKey = originalBlock.getEntityAt(initialSelectionOffset);
        // if it finds it then return
        if (entityKey !== null) {
          return { entityKey, isEndOfParagraph };
        }
      }
    }

    // cover edge cases where it doesn't find it
    return { entityKey, isEndOfParagraph };
  }*/

  updateTimecode = (data) => {
    console.log("updating with data", data)
  }

  renderBlockWithTimecodes = () => {
    return {
      component: WrapperBlock,
      editable: true,
      props: {
        showSpeakers: this.state.showSpeakers,
        showTimecodes: this.state.showTimecodes,
        timecodeOffset: this.state.timecodeOffset,
        editorState: this.state.editorState,
        setEditorNewContentState: this.setEditorNewContentState,
        onJumpToHereClick: this.props.onJumpToHereClick,
        onWordClick: this.props.onWordClick,
        handleAnalyticsEvents: this.props.handleAnalyticsEvents,
        settingTimecodeFor: this.state.settingTimecodeFor,
        updateTimecode: this.updateTimecode,
        togglePlayMedia: this.props.playMedia,
        isPlaying: this.props.isPlaying,
        currentTime: this.props.currentTime,
      }
    };
  }

  copyCurrentTimeToClipboard = () => {
    const text = `https://ryanquey.github.io/khmer-react-transcript-editor?startTime=${ this.props.currentTime }`
    navigator.clipboard.writeText(text).then(function() {
      console.log('Async: Copying to clipboard was successful!');
    }, function(err) {
      console.error('Async: Could not copy text: ', err);
    });
  }

  // TODO just do 2 js calls, one to scroll, the other to get current word. Much neater
  getCurrentWord = (checkToScroll = true) => {
    const currentWord = {
      start: 'NA',
      end: 'NA'
    };

    const nextWord = {
      start: 'NA',
      end: 'NA'
    };

    let blockMap
    if (this.state.transcriptData) {
      const contentState = this.state.editorState.getCurrentContent();
      // TODO: using convertToRaw here might be slowing down performance(?)
      const contentStateConvertEdToRaw = convertToRaw(contentState);
      blockMap = contentStateConvertEdToRaw.blocks;

      // TODO since ran so many times, consider slightly faster loop (reg for loop?)
      for (var i = 0; i < blockMap.length; i++) {
        const block = blockMap[i] || {};
        let word = ((block.data || {}).words || [])
        
        // TODO happens if we split a paragraph...need a better more consistent system for this...
        if (List.isList(word)) {
          word = word.toJSON()[0] || {};
        } else {
          word = word[0] || {}
        }
        if (word.end === undefined || word.end === undefined) {
          console.log("this word is broken...", word, block)
        }

        if (word.start <= this.props.currentTime && word.end >= this.props.currentTime) {
          currentWord.start = word.start;
          currentWord.end = word.end;

          const nextBlock = blockMap[i + 2] || blockMap[i + 1]
          const next = nextBlock && ((nextBlock.data || {}).words || [])[0] || {};
          if (next) {
            // won't be a next for last word in transcript
            nextWord.start = next.start;
            nextWord.end = next.end;
          }
          break
        }

      }
    }

    if (checkToScroll && currentWord.start !== 'NA' && this.props.isPlaying()) {
      if (this.props.isScrollIntoViewOn) {
        const thisWordElement = document.querySelector(`.Word[data-start="${ currentWord.start }"]`);
        const nextWordElement = document.querySelector(`.Word[data-start="${ nextWord.start }"]`);
        // there should always be currentWordElement, but just in case...
        thisWordElement && thisWordElement.scrollIntoView({ block: 'nearest', inline: 'center' });
        nextWordElement && nextWordElement.scrollIntoView({ block: 'nearest', inline: 'center' });
      }
    }
    if (this.state.transcriptData && currentWord.start === "NA") {
      // there's a bug in the code!
      // console.log("What is going wrong with the blocks?", blockMap, "currentWord", currentWord);
      // console.log("for the time:", this.props.currentTime);
    }

    return currentWord;
  }

  render() {
    const helpMessage = <div className={ style.helpMessage }>
      <span><FontAwesomeIcon className={ style.icon } icon={ faMousePointer } />Double click on a word or timestamp to jump to that point in the video.</span>
      <span><FontAwesomeIcon className={ style.icon } icon={ faICursor } />Start typing to edit text.</span>
      <span><FontAwesomeIcon className={ style.icon } icon={ faUserEdit } />You can add and change names of speakers in your transcript.</span>
      <span><FontAwesomeIcon className={ style.icon } icon={ faKeyboard } />Use keyboard shortcuts for quick control.</span>
      <span><FontAwesomeIcon className={ style.icon } icon={ faSave } />Save & export to get a copy to your desktop.</span>
    </div>;

    const tooltip = <Tooltip
      className={ style.help }
      content={ helpMessage }
      fadeDuration={ 250 }
      fadeEasing={ 'ease-in' }
      placement={ 'bottom' }
      radius={ 5 }>
      <FontAwesomeIcon className={ style.icon } icon={ faQuestionCircle } />
      How does this work?
    </Tooltip>;

    const currentWord = this.getCurrentWord(true); // arg is true, so scrolls if setting says to
    const highlightColour = '#c0def3';
    const unplayedColor = '#767676';
    const correctionBorder = '1px dotted blue';

    // Time to the nearest half second
    const time = Math.round(this.props.currentTime * 4.0) / 4.0;

    const editor = (
      <section
        className={ style.editor }
        onDoubleClick={ event => this.handleDoubleClick(event) }>

        <style scoped>
          {`.Word[data-start="${ currentWord.start }"] { background-color: ${ highlightColour }; text-shadow: 0 0 0.01px black }`}
          {/*`div.Word[data-start="${ currentWord.start }"]+span { background-color: ${ highlightColour } }` This would highlight edits that are added to the original. Doesn't highlight text before though...would have to use JS and dig into draft js more   */}
          {`.Word[data-prev-times~="${ Math.floor(time) }"] { color: ${ unplayedColor } }`}
          {`.Word[data-prev-times~="${ time }"] { color: ${ unplayedColor } }`}
          {`.Word[data-confidence="low"] { border-bottom: ${ correctionBorder } }`}
        </style>

        <Editor
          editorState={ this.state.editorState }
          onChange={ this.onChange }
          stripPastedStyles
          blockRendererFn={ this.renderBlockWithTimecodes }
          handleKeyCommand={ command => this.handleKeyCommand(command) }
          keyBindingFn={ e => this.customKeyBindingFn(e) }
        />
      </section>
    );

    return (
      <section>
        { tooltip }
        <span onClick = { this.copyCurrentTimeToClipboard } style={ { cursor: 'pointer' } }><FontAwesomeIcon icon={ faShareSquare } title="Share Current Time"/>&nbsp;Share Current Time</span>
        { this.props.transcriptData !== null ? editor : null }
      </section>
    );
  }
}

// DraftJs decorator to recognize which entity is which
// and know what to apply to what component
  /*
const getEntityStrategy = mutability => (contentBlock, callback, contentState) => {
  contentBlock.findEntityRanges((character) => {
    const entityKey = character.getEntity();
    if (entityKey === null) {
      return false;
    }

    return contentState.getEntity(entityKey).getMutability() === mutability;
  }, callback);
};

// decorator definition - Draftjs
// defines what to use to render the entity
const decorator = new CompositeDecorator([
  {
    strategy: getEntityStrategy('MUTABLE'),
    component: Word,
  },
]);
*/ // NOTE no longer using entities, so not really using the Word component in same way either, just using the WrapperBlock

TimedTextEditor.propTypes = {
  transcriptData: PropTypes.object,
  mediaUrl: PropTypes.string,
  isEditable: PropTypes.bool,
  onWordClick: PropTypes.func,
  sttJsonType: PropTypes.string,
  isPlaying: PropTypes.func,
  playMedia: PropTypes.func,
  currentTime: PropTypes.number,
  isScrollIntoViewOn: PropTypes.bool,
  isPauseWhileTypingOn: PropTypes.bool,
  timecodeOffset: PropTypes.number,
  handleAnalyticsEvents: PropTypes.func
};

export default TimedTextEditor;

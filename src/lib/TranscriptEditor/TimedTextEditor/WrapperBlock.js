import React from 'react';
import { EditorBlock, Modifier, EditorState, SelectionState } from 'draft-js';

import SpeakerLabel from './SpeakerLabel';
import { shortTimecode, secondsToTimecode } from '../../Util/timecode-converter/';

import style from './WrapperBlock.module.css';
import { Map, List, fromJS } from 'immutable'

class WrapperBlock extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      speaker: '',
      start: 0, // time in seconds from start of media
      timecodeOffset: this.props.blockProps.timecodeOffset
    };
  }

  componentDidMount() {
    const { block } = this.props;
    const speaker = block.getData().get('speaker');

    const start = block.getData().get('start');

    this.setState({
      speaker: speaker,
      start: start,
    });
  }

  handleOnClickEdit = () => {
    const newSpeakerName = prompt('New Speaker Name?');

    if (newSpeakerName !== '' && newSpeakerName !== null) {
      this.setState({ speaker: newSpeakerName });
      if (this.props.blockProps.handleAnalyticsEvents !== undefined) {
        this.props.blockProps.handleAnalyticsEvents({
          category: 'WrapperBlock',
          action: 'handleOnClickEdit',
          name: 'newSpeakerName',
          value: newSpeakerName
        });
      }

      // From docs: https://draftjs.org/docs/api-reference-selection-state#keys-and-offsets
      // selection points are tracked as key/offset pairs,
      // where the key value is the key of the ContentBlock where the point is positioned
      // and the offset value is the character offset within the block.

      // Get key of the currentBlock
      const keyForCurrentCurrentBlock = this.props.block.getKey();
      // create empty selection for current block
      // https://draftjs.org/docs/api-reference-selection-state#createempty
      const currentBlockSelection = SelectionState.createEmpty(keyForCurrentCurrentBlock);
      const editorStateWithSelectedCurrentBlock = EditorState.acceptSelection(this.props.blockProps.editorState, currentBlockSelection);

      const currentBlockSelectionState = editorStateWithSelectedCurrentBlock.getSelection();
      const newBlockDataWithSpeakerName = { speaker: newSpeakerName };

      // https://draftjs.org/docs/api-reference-modifier#mergeblockdata
      const newContentState = Modifier.mergeBlockData(
        this.props.contentState,
        currentBlockSelectionState,
        newBlockDataWithSpeakerName
      );

      this.props.blockProps.setEditorNewContentState(newContentState);
    }
  }

  getPrevStartTime = () => {
    const keyForCurrentCurrentBlock = this.props.block.getKey();
    const prevBlock = this.props.contentState.getBlockBefore(keyForCurrentCurrentBlock); 
    // won't be a prev block if it's the first block!
    const prevBlockStart = prevBlock ? prevBlock.getData().get('start') : 0;

    return parseFloat(prevBlockStart)
  }

  getEndTime = () => {
    const keyForCurrentCurrentBlock = this.props.block.getKey();
    const nextBlock = this.props.contentState.getBlockAfter(keyForCurrentCurrentBlock); 
    // won't be a next block if it's the last block, so setting really high number
    const nextBlockStart = nextBlock ? nextBlock.getData().get('start') : 9*999*999*999;

    return parseFloat(nextBlockStart)
  }

  handleTimecodeClick = () => {
    this.props.blockProps.togglePlayMedia(false);
    console.log("stopping@")
    const doIt = () => {

      let newStartTime = prompt('New Time in seconds? (Prev time: [coming soon])');
      newStartTime = parseFloat(newStartTime)

      if (newStartTime !== '' && newStartTime !== null) {

        // make them put in new time or just cancel if start time is after end time
        if (newStartTime >= this.getEndTime() ||
          newStartTime <= this.getPrevStartTime()
        ) {
          alert("Start Time must be before next block's start time")

          return
        }

        this.setState({ start: newStartTime });

        // Get key of the currentBlock
        const keyForCurrentCurrentBlock = this.props.block.getKey();

        // create empty selection for current block
        // https://draftjs.org/docs/api-reference-selection-state#createempty
        const currentBlockSelection = SelectionState.createEmpty(keyForCurrentCurrentBlock);
        const editorStateWithSelectedCurrentBlock = EditorState.acceptSelection(this.props.blockProps.editorState, currentBlockSelection);

        const currentBlockSelectionState = editorStateWithSelectedCurrentBlock.getSelection();

        let wordsData = this.props.block.getData().get('words') || [ {} ] // really should just break...being too flexible here...
        console.log("words data", wordsData)
        if (!List.isList(wordsData) || !Map.isMap(wordsData)) {
          wordsData = fromJS(wordsData)
        }
        wordsData = wordsData.setIn([ 0, 'start' ], newStartTime)
        console.log("words data", wordsData)

        const newBlockData = {
          start: newStartTime,
          words: wordsData,
        };
        console.log(newBlockData, newBlockData.words.toJSON()[0])


        // https://draftjs.org/docs/api-reference-modifier#mergeblockdata
        const newContentState = Modifier.mergeBlockData(
          this.props.contentState,
          currentBlockSelectionState,
          newBlockData
        );

        const newerEditorState = this.props.blockProps.setEditorNewContentState(newContentState);

        //////////////////////////////////////////////////////
        // set end time of previous block to this start time TODO (though if never use end time in app, might not be necessary
        const previousBlock = this.props.contentState.getBlockBefore(keyForCurrentCurrentBlock);
        // won't be a prev block if it's the first block
        if (previousBlock) {
          const previousBlockSelection = SelectionState.createEmpty(previousBlock.getKey());
          const editorStateWithSelectedPrevBlock = EditorState.acceptSelection(this.props.blockProps.editorState, previousBlockSelection);

          const prevBlockSelectionState = editorStateWithSelectedPrevBlock.getSelection();
          let prevWordsData = previousBlock.getData().get('words') || [ {} ]// really should just break...being too flexible here...
          // draft js will turn into immutable anyways, so might as well beat them to the punch
          if (!List.isList(prevWordsData) || !Map.isMap(prevWordsData)) {
            prevWordsData = fromJS(prevWordsData)
          }
          prevWordsData = prevWordsData.setIn([ 0, 'end' ], newStartTime)

          const newPrevBlockData = {
            words: prevWordsData,
          };

          // https://draftjs.org/docs/api-reference-modifier#mergeblockdata
          const newPrevBlockContentState = Modifier.mergeBlockData(
            newerEditorState.getCurrentContent(),
            prevBlockSelectionState,
            newPrevBlockData
          );

          this.props.blockProps.setEditorNewContentState(newPrevBlockContentState);
        }
      }
      // this.props.blockProps.togglePlayMedia(true)
    }

    // this is so bad...but so is using prompt ha
    // makes sure that the video stops, because if prompt opens before it stops, it keeps playign
    const interval = setInterval(() => {
      if (!this.props.blockProps.isPlaying()) {
        clearInterval(interval)
        doIt();
      }
      console.log("still waiting")
    }, 20)

  }

  handleJumpToHereClick = () => {
    this.props.blockProps.onJumpToHereClick(this.state.start);
  }

  render() {
    let startTimecode = this.state.start;
    const { blockProps } = this.props
    if (blockProps.timecodeOffset) {
      startTimecode += this.props.blockProps.timecodeOffset;
    }

    const speakerElement = <SpeakerLabel
      name={ this.state.speaker }
      handleOnClickEdit={ this.handleOnClickEdit }
    />;

    const timecodeElement = <span className={ style.time } onClick={this.handleTimecodeClick}>{shortTimecode(startTimecode)}</span>;

    return (
      <div className={ style.WrapperBlock }>
        <div className={ style.markers }>
          <button onClick={ this.handleJumpToHereClick }>Jump to Here</button>
          {blockProps.showSpeakers ? speakerElement : ''}
          {blockProps.showTimecodes ? timecodeElement : ''}
        </div>
        <div className={ style.text }>
          <EditorBlock { ...this.props } />
        </div>
      </div>
    );
  }
}

export default WrapperBlock;

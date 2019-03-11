import React, { PureComponent } from 'react';
import { Map, List, fromJS } from 'immutable'
import PropTypes from 'prop-types';

class Word extends PureComponent {
  generateConfidence = (data) => {
    // handling edge case where confidence score not present
    if (data.confidence) {
      return data.confidence > 0.6 ? 'high' : 'low';
    }

    return 'high';
  }

  generatePreviousTimes = (data) => {
    let prevTimes = '';

    for (let i = 0; i < data.start; i++) {
      prevTimes += `${ i } `;
    }

    if (data.start % 1 > 0) {
      // Find the closest quarter-second to the current time, for more dynamic results
      const dec = Math.floor((data.start % 1) * 4.0) / 4.0;
      prevTimes += ` ${ Math.floor(data.start) + dec }`;
    }

    return prevTimes;
  }

  render() {
    // including a lot of catchers since there always seems to be an empty block with no text and data sneaking in here
    let data = this.props.block && this.props.block.getData() || { words: [ {} ] }
    if (Map.isMap(data)) {
      data = data.toJSON()
    }
    let wordsData = data.words || {}
    wordsData = wordsData[0] ? wordsData[0] : {}


    return (
      <div
        style={ {
          display: 'inline-block',
        } }
        data-start={ wordsData.start }
        data-end={ wordsData.end }
        data-confidence = { this.generateConfidence(wordsData) }
        data-prev-times = { this.generatePreviousTimes(wordsData) }
        data-entity-key={ '' }
        data-block-key={ this.props.block.getKey() }
        className="Word">
        {this.props.children}
      </div>
    );
  }
}

Word.propTypes = {
  contentState: PropTypes.object,
  //entityKey: PropTypes.string,
  block: PropTypes.object,
  // children: PropTypes.array
};

export default Word;

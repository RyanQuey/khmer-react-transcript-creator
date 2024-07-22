# React Transcript Editor

A React component to make speech recognition for Khmer audio and video easier and faster.

## Development env

- npm > `6.1.0`
- [Node 10 - dubnium](https://scotch.io/tutorials/whats-new-in-node-10-dubnium)

Node version is set in node version manager [`.nvmrc`](https://github.com/creationix/nvm#nvmrc)


## Setup
```
nvm use
npm i
npm start
```

Visit [http://localhost:3000](http://localhost:3000)


## Use custom replacer:
Use JSON string, with each key as something to be replaced, and value as what to replace it with. 

E.g., 

```
{ "សួរ": "លា", "បូរ៉ា": "Ryan" yan"}
```

(all "សួរ" becomes "លា"). 

Then keep transcribing!

### Copy from spreadsheet
If you want to keep your settings in a spreadsheet, you can do that then just copy it into the


- In Spreadsheet, use one column per entry (first row of column, what to replace; second row of column, what to put in)
- Use an Excel to JSON converter, e.g.:
    * https://tableconvert.com/excel-to-json (also includes "transposing" if you used one row per entry)
    * https://codepen.io/mmabale/full/YWwRjm

- Copy that into the app and go!
### Save your progress
- Save to up to two local storage spots, and retrieve for the future.
- Automatic saving of last value of field using a third local-storage key, which gets retrieved on reload. 


## Acknowledgements
- https://github.com/bbc/react-transcript-editor
Demo can be viewed at [https://bbc.github.io/react-transcript-editor](https://bbc.github.io/react-transcript-editor)
- https://github.com/JamesBrill/react-speech-recognition

## Deployment

```
npm run deploy:ghpages
```
Or even easier:
```
./scripts/deploy.sh
```

## Licence

See [LICENCE.md](./LICENCE.md)


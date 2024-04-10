import { CircularPool, makeCircularPool } from './circularPool';
import { keysByNote, setupKeyboard } from './keyboard';
import './reset.css';
import './styles.css';

import * as Tone from 'tone';

// when we are allowed to use MIDI 
// is this when midi loads in for us or when is this**
// why did we have to wait for midi to load whereas in other API's we did not have to wait for a load**
// do we have a load event here for all web API's or only this one**
const onMIDISuccess = (midi: MIDIAccess) => {
  console.log('MIDI ready!');

  // show which devices are connected
  // how do we know what the midi is here and what we pass into this method**
  // how do we know what midi access data type is if we never defined it**
  // so this shows the inputs and the outputs when the midi is done loading how because we did not press a key yet
  // when midi loads**
  listInputsAndOutputs(midi);

  // start listening for MIDIMessages on all devices
  // how do we know what midi is and the inputs as well here (is it built in for midi and we can use this anywhere for inputs and midi
  // or no)**
  // how do we know how many midi inputs we have (we did not store it in an array so why can we use a for each loop)**
  // the input. in the foreach loop is each input from the midi array because of the foreach right**
  midi.inputs.forEach((input: MIDIInput) => {
    // so for each midi input here what do we do** 
    input.onmidimessage = onMIDIMessage;
  });
};

// when we cannot use MIDI for some reason
// what is a situation where we can't use midi**
const onMIDIFailure = (reason: any) => {
  console.error(`Failed to get MIDI access - ${reason}`);
};

const listInputsAndOutputs = (midi: MIDIAccess) => {
  // if we were doing this for real...
  // we'd want to expose these midi.inputs as possible selections from a dropdown menu
  // so the user could choose between multiple MIDI devices on their machine
  // what does this mean**

  // FOR EXAMPLE - at home I have a Loupedeck CT
  // and that registers as a MIDI device, despite not being music-related**

  //so do the inputs for midi go to everything that uses midi that is connected to the computer even the keyboard and mouse**
  //why did we do entry[1] for the midi.inputs here** and how do we know what the midi.inputs are**
  //how do we know input has everything we return in the console** (what is included in input)**
  //how does it know all this information for the input and inputs**
  //what are in the midi.inputs and what are in them**
  for (const entry of midi.inputs) {
    const input = entry[1];
    console.log(
      `Input port [type:'${input.type}']` +
        ` id:'${input.id}'` +
        ` manufacturer:'${input.manufacturer}'` +
        ` name:'${input.name}'` +
        ` version:'${input.version}'`,
    );
  }

  //how do we know what is included in the outputs and how did we know to target entry[1] from the outputs 
  //what is the difference between the console.log() for the input and output**
  for (const entry of midi.outputs) {
    const output = entry[1];
    console.log(
      `Output port [type:'${output.type}'] id:'${output.id}' manufacturer:'${output.manufacturer}' name:'${output.name}' version:'${output.version}'`,
    );
  }
};

//how does it know what gets passed into this method based on 
//the foreach loop in onmidisuccess (input.onmidimessage = onMIDIMessage;)**
const onMIDIMessage = (event: MIDIMessageEvent) => {

  //what does this do**
  //what is data and how did we get it**
  const data = event.data as Uint8Array;

  // write a message to the console about this MIDI event
  // why did we need a timestamp and the length of the data what does it represent**
  // how does this all get output to the console is the timestamp and the length of the data just 1 number**
  // how is the length of the data representing bytes when we had 3 bytes of data for one input (this only shows one byte
  // or number for the length of the data array only)**
  //why do we need this here**
  let str = `MIDI message received at timestamp ${event.timeStamp}[${data.length} bytes]: `;
  //we can say let or const in a for of and for in loop right (what about var)**
  //what exactly is in data and what are we doing here**
  for (const character of data) {
    //what are we adding to the string and why did we say 10 here**
    //is everything in data (array??)** numbers is that why we have to convert it to a string here**
    str += `${character.toString(10)} `;
  }
  //what gets output to the console for this statement here**
  console.log(str);

  // Pull the command, note, and velocity from the data
  // https://midi.org/summary-of-midi-1-0-messages
  //is the .at only used for web MIDI API what does it do**
  //what does valueof do (does it get the value of whatever is in that entry for the data (array??))**
  //we divide velocity by 100 because the tone API only accepts entries between 0 and 1 only for our velocity so our velocity
  //needs to be in between 0 and 1** (does the web MIDI accept any value though)**
  //why did we use tone API and web MIDI (what is the difference between the two API's)**
  let command = data.at(0)?.valueOf()!;
  let note = data.at(1)?.valueOf()!;
  let velocity = data.at(2)?.valueOf()! / 100;

  // what does this mean and what does this do**
  // 144 maps to a Note-On event on MIDI Channel 1
  if (command === 144) {
    // play the note at the given velocity
    playNote(note, velocity);
  }

  // Fun fact - depending on the device:
  // (Note Off) is the same as (Note On with Velocity 0)
  // was this the case for our simulation on the PC (note off was the same as note on with velocity 0)**
  // or which devices have this or the note off**

};

const playNote = (note: number, velocity: number) => {
  // note number/name/frequency chart:
  // https://newt.phys.unsw.edu.au/jw/notes.html

  //is this like date.now which gets the current time in ms and date how is it different**
  let now = Tone.now();

  // Tone.Midi(note) : converts a midi note number to a usable frequency value
  // so is this based on the key we press since the note is a number (uint 8 (8 bytes or digits))** for the piano only (or all
  // instruments)**
  // we then convert that to something tone takes in for a piano (or all instruments)** which is the A0, A1, etc. corressponding
  // to the note number we pass in**
  // this only does the conversion from MIDI number to tone (what datatype)**
  // for the key we press for the note right not all the MIDI numbers for the keys (notes)**at one time (how)**
  // once we convert from MIDI number note to tone does it stay as a tone datatype**
  // or each time we press the key (even if it's repeated) it will be a midi number then convert
  // a tone datatype**
  let frequency = Tone.Midi(note);

  if (velocity !== 0) {
    // this is a note-on event

    // get the next available synth from the pool
    // how do we kniw what synthPool is if we never defined it**
    // what does this do**
    let activeSynth = synthPool.nextItem();
    // remember it as the synth that has played the note (store in synthsByNote)
    // where did we define this**
    // what does this do**
    synthsByNote[note] = activeSynth;
    // actually cause audio to be played
    // is this method built in for MIDI or tone API (what does does it do) same for triggerrelease**
    // how did we know what to put in this method**
    activeSynth.triggerAttack(frequency, now, velocity);
    // update the <li> to show the key is active
    // so this array stores all the keys and based on the note we index the array and say that 
    // list item class name is now playing (but if it's not playing we don't see anything on that list name in the
    // inspector and we remove the class name playing in code)**
    // how does it know the index is a number for the note if we convert it to a tone datatype
    // (is it because we had a different variable for the conversion
    // (frequency varibale)** but the same note variable had the number)**
    // I thought the note was a unit8 so how does it know to index the specific entry we need in the array**
    keysByNote[note].classList.add('playing');
  } else {
    // this is a note-off event

    // get the synth that last played the note
    // why did we get a certain index for the trigger release but we did not for the trigger attack (is it because 
    // we had a variable for the index and we used the variable instead of the plain index in trigger attack)**
    // what does the now refer to in triggerrelease and trigger attack**
    // how do we know what trigger release takes in**
    synthsByNote[note].triggerRelease(now);

    // update the <li> to show the key is no longer active
    // when we are done playing then remove the class list item from the specific element in the array**
    // how does it know to remove the played item from the array and to stop playing the audio for the piano when it's done**
    // why do we need an array for the notes we need to play (we need one to map key notes which we have here but did we need one
    // for the queue we had of keys to be played if we pressed multiple)**
    // how do we know what to put in the arrays for the keynotes and the queue for the keys we want to play**
    keysByNote[note].classList.remove('playing');
  }
};

// actually request access to the MIDI devices connected to this computer
//how do we know when this gets called**
//why did we make this a promise**
//is this initialization code when does this get called and why did we not put it in a window.onload instead then**
navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

//what does this mean**
let synthPool: CircularPool<Tone.Synth>;
let synthsByNote: Tone.Synth[] = [];
const beginButton = document.querySelector('#beginButton') as HTMLButtonElement;

// To play audio in the browser, we have to respond to a click event (or other user input)
// No autoplay allowed!
// why did we have a promise with the button could we just have had a click event to start the audio**
beginButton.addEventListener('click', async () => {
  // Tone handles initializing the audio context and all that
  // so we pause the whole program until we know our audio has loaded in (is that what the tone.start() means
  // or does it start playing the audio)**
  await Tone.start();

  // Hide the beginButton (but as visibility hidden so it doesn't make the layout jump)
  // so it's hidden but we can still click it right if we know where it is**
  // is this the same for all things that are hidden we can still interact with them**
  beginButton.style.visibility = 'hidden';

  // Create a CircularPool holding 10 Tone.Synth objects, ready to use
  // what does this do** what does the <> do for the generics how is it different from defining a variable 
  // or parameter with a datatype**
  // is synth and todestination built into tone what does this do**
  // what does the 10 do**
  synthPool = makeCircularPool<Tone.Synth>(10, () =>
    new Tone.Synth().toDestination(),
  );

  // Generate the DOM <li> elements that make our on-screen keyboard
  // set up all our keys initially (why do we call play note though if we are just setting up the keys
  // array (keybynote array))**
  setupKeyboard(playNote);
});

/**
 * NEW NOTES:
 * 
 * web midi (musical instrument digital interface)
 * we have USB access right in the browser for us (thats how it knows to use midi with what is connected to our computer
 * right)** (this only works if what we have connected uses midi right how would we know)**
 * 
 * we will use the midi message events and it transmits the timestamp for us and the data object is a uint 8 array of length 3
 * (3 bites for each key event we have for the piano)** (what does it mean by high resolution and sub millisecond
 * for timestamp)**(go over slide 2)**
 * 
 * how do we know if something is a midi device (slide 2)**
 * 
 * midi is useful outside of music and midi MSC is used for controlling lights on stage 
 * as well as rhythm games and we could use midi for our node on or off or step on or 
 * step off for the different rhythm game (anything that has an on or off
 * state can be good for midi to use for transport layer)** (slide 3)**
 * 
 * when would be a case of using dim for midi would it be with MSC (built into midi for only state lights or)** (slide 3)**
 * 
 * the first 4 bits of the first byte is the event type (1001 for todays demo with piano only)
 * (what about other instruments when would the number change)** and it encodes to 144 because its the higher
 * bits and since we use channel 4 the rest of the numbers would be 0 after the 4 numbers (go over slide 4)**
 * how do we know what the channel is for the first byte of data)** (what does each byte represent)**
 * (slide 4)** (why is the line split on the first byte is it because the last 4 numbers will always be 0 for the unit8)**
 * (does midi only use unit8 so we need 8 digits no matter what for our bytes and what else)**
 * the first byte represents** (what would the first byte be used for if it was not a piano)**
 * 
 * the next byte has the key note number and ignores the first number (always for second byte in midi)**
 * and gives us the rest of the numbers and the keyboard ranges from
 * 21-108 and our range for this byte is 0-127 which is good for us since it's within the range** (go over slide 4)**
 * the second byte represents our keys (what would the second byte be used for if it was not a piano)**
 * 
 * the last byte stored velocity information for how hard or how fast we pressed the key (encoded using the last 7 bits of the byte
 * and we use 0 to** but it stores 0 to)** (what would the third byte represent if it was not a piano)**
 * 
 * are the second and third byte usually have a 0 in the beginning and the rest can can any number but for the first byte
 * the four 0's alwways have to be at the end and the rest can be anything**
 * (the bytes can be 0 or 1 right what does it represent for 0 and 1)**
 * 
 * do all the bytes represent the same thing no matter what instrument it is or whatever we use in midi**
 * 
 * what was the link on slide 4 and where did we have to go to specifically**
 * 
 * we only care about node the node on event (instead of having a node off event for this keyboard it uses a node on with a velocity 
 * of 0 to show the keyboard button is not being pressed)**
 * 
 * MAIN BRANCH:
 * 
 * we have a begin button for page interaction to start playing audio (we can use the mouse to play the piano or we can play
 * it with a piano connected to the computer)
 * 
 * we use tone.js to produce the notes and something** recognizes the notes (in the console)**
 * 
 * we have an input and output port which brings our key into midi and we get output a sound or (in the console)**
 * 
 * we have our node on event, whcih event it was, and the velocity of where we pressed it in the console**
 * 
 * INDEX.HTML:
 * 
 * begin button and an unordered list for when we create the buttons to put it in this unordered list 
 * 
 * MAIN.TS:
 * 
 * there is a navigator that requests midi access to do the work for us (when)** (a lot of these API's use the navigator because
 * it's for the window and we use web API's with the window)**
 * 
 * for onsuccess we list the inputs and outputs and for all the inputs we say that anytime we get a new midi message run it through
 * this onmidi fucntion (which onmidifunciton)**
 * 
 * once we have an input we can ask for all the information for a key we press in the console** (how)**
 * 
 * onmidi message we pull the data we got from the event.data and the code logs the message for each of the node plays
 * and we look at the data and we say give us the information at byte 0, 1, and 2 (3 bytes for each key)(what is the 
 * event.data from to get our byte information and what else is included in the event.data)**
 * 
 * the tone.js wants velocity to be from 0 to 1 so we divide by 100 so we get that number that is 0 or 1 and not in between**
 * instead of a large number for velocity (in the console we get a number larger than one though for the velocity)**
 * 
 * midi ends up saying we have the lowest key which is 21 and it gives us a sequential list of notes all the way until 108
 * and we have the note name in midi and it gives us a tone value for** what tone.js does and we use
 * tone.midi(specifci singular note)** to convert a midi number to a tone letter and number like how it should be
 * (A0, A1, A2, etc.) to play the sonud otherwise it will not play** (slide 6)** (how did we know to convert
 * one specific midi note and not the array for tone.midi(note))** (could we have just converted the whole array
 * so we could just use those tone values instead of cnverting from midi to tone each piano button press)**
 * 
 * what does midi do and what does tone.js do**
 * 
 * USING SPARSE ARRAYS:
 * 
 * we need to store our keys (its only one keyboard value right not key value pair in this case for one entry in the array)**
 * and we want to talk about each list item that was playing and we know those items have an id from 21 to
 * 108 so we can use a sparse array to start indexing from 21 to 108 so we don't have to have 
 * real keyboard entries before or after those indexes (only undefined)** 
 * 
 * what does it mean by synthsbytnote because thats not an array we made for slide 7**
 * why would we have values beyond 108 for our array I thought it was 
 * only the values from before 21 that was undefined** (slide 7)**
 * 
 * synthsbynote allows us to reference the list item we has created and the playing class lets our button turn green when we play it 
 * and we turn it off when we are done playing that note (how)**
 * 
 * CIRCULAR POOL / BUFFER / QUEUE:
 * 
 * if we want to play more notes we need more synths and we need this circular pool (or buffer or queue)** to keep track of those
 * objects and use them over time (like an array that stores 8 items and it tracks the index for us and we get the next available
 * synth as we keep playing then when we are done we stop using the synth and the arrays clears)** (slide 8)**
 * 
 * when we want to play the note and we go to the next item function wouldnt the first note get skipped in the array then (the 0th
 * index)** (slide 8)**
 * 
 * for slide 8 last 2 bullets does this happen automatically or do we have something like a function made to handle
 * these two cases** (same for the rest of the bullets)**
 * 
 * we say synthpool give us the next item then save it so we can turn it off later then trigger an attack with the frequency, now, and
 * velocity which actuall plays the note for us and when we let go of the key we say synthbtnote to turn it off
 * 
 * the setup for all if this begins when we press the begin button (we have to ask for user consent to make noise)
 * we then hide begin button once we press it then make out circular pool
 * 
 * the make circular pool function takes the quantity then the function to
 * 
 * tone.synth is a generic and we wrote our circular pool so we can take any object here is can store (like numbers, or strings
 * but here we want to say tone.synth)
 * 
 * CIRCULAR POOL.TS:
 * 
 * we take a callback that accepts a type of type t so we can do things with every item here and for generics we use <something inside
 * like a data type> to do something and it only takes in that data type 
 * 
 * we then set the size as the pool size which is T elements then we go from 0-size then populate with item builder and we get a
 * new synth and save that in the pool (the next item is saying go to the next index and modulus by the size to get the next thing
 * at the index)(circular pool.js)**
 * 
 * at the end of this file we return the nextItem and forEach and this can be used in any other file but whatever is not in the
 * return is private to this file (in that function) (what else is closures used with because I thought it was only used for
 * classes)**
 * 
 * the idea of a circular pool could be useful for particle systems or bullet particles in a game (same five objects used over and over)
 * (how)**
 * 
 * go over slide 8**
 * 
 * KEYBOARD.TS:
 * 
 * when we call setup keyboard we call the playnote so it knows to play a note then we get the ul keyboard element from
 * index.html then we go from 21 to 108 and we create each key and stick it into the index.html (if we look in the console
 * the unordered list has a bunch of key items in it for each key and we style certain keys to have black on it as well)
 * there is also a playing class an it shows when we press a key but hides
 * when we don't play a key for that certain item in the list**
 * 
 * STYLES.CSS:
 * 
 * the black keys get pulled up because 
 * we give negative margins so everything will be close together and for the black keys we give is a higher z-index so 
 * it shows on top of the white keys**
 * 
 * 
 * KEYBOARD.TS:
 * 
 * we use the keybynote[i] to know which key to press and which note to play
 * to figure out which key is black we**
 * 
 * we picked these numbers for the black keys because when we do modulo after the 12th key it's 0 so we start the loop
 * all over again to get the rest of the black keys**
 * 
 * the rest of it is all event handlers and the mousedown and mouseup we play with a velocity of 1** (how do we know 
 * its a velocity of 1)** and we track if the mouse
 * is up (false) or down (true) for mouse down variable** and we only play a note when the mouse is down**
 * 
 * onmouseup on the body says mousedown is false (the mouse is up)** and turns all the key nodes** off**
 * 
 */

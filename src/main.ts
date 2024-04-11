import { CircularPool, makeCircularPool } from './circularPool';
import { keysByNote, setupKeyboard } from './keyboard';
import './reset.css';
import './styles.css';

import * as Tone from 'tone';

// when we are allowed to use MIDI 
// is this when midi loads in for us or when is this (yes it when it loads for us)
// why did we have to wait for midi to load whereas in other API's we did not have to wait for a load (we did have some sort of load
// so there will be a resolve or reject and it varies from resolved to reject)
const onMIDISuccess = (midi: MIDIAccess) => {
  console.log('MIDI ready!');

  // show which devices are connected
  // midiaccess returns the inputs and outputs and the sysexenabled (we don't have to worry about this)
  listInputsAndOutputs(midi);
  //just tells us whats there and the foreach below is what we actually do for the connection 

  // start listening for MIDIMessages on all devices
  midi.inputs.forEach((input: MIDIInput) => {
    // onmidi message is an event listener and we go to onmidimessage 
    //this is what connects our device to use midi
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
  // have a different dropdown for the device we want to use for midi but here we add listeners for everything
  // and it does not matter which device we use the midi on we will still hear the sound 

  // FOR EXAMPLE - at home I have a Loupedeck CT
  // and that registers as a MIDI device, despite not being music-related

  //goes through each midi thing connected to out computer and sets up the midi event handler for line 16 in GitHub main.TS

  // for the midi for the inputs 
  // entry is array of 2 elements and first element is some kind of ID and the second element is the actual midi object
  // midi.inputs is a map and its key value (each entry is a key and value)(an array of a arrays and within the arrays
  // we go to the first item which is the value)
  // the inputs and outputs are a key value pair (the key is the id and the value is what we want like what we see in the console
  // statements below)
  // midi.inputs is the whole array and entry is each entry as an array of key value pairs and we get entry 1 for the value
  // because we don't want th key (id) we just want to values stored in each key
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

  // these shows up when we have the navigaot.requestmidiaccess at the bottom then we go to onsuccess and onfailure
  // then from onsuccess we go to input.onmididmessage in that foreach loop then it does the outputs for onmididmessage
  // (the input.inmidimessage is for an action if we click the buttons)
  // when the navigator requests the midi on line 109 in GitHub that starts everything out and we get all the data for all out midi
  // devices
  // if there is no failure then the onmididfailure is never called only the onsuccess for line 109 on GitHub
  for (const entry of midi.outputs) {
    const output = entry[1];
    console.log(
      `Output port [type:'${output.type}'] id:'${output.id}' manufacturer:'${output.manufacturer}' name:'${output.name}' version:'${output.version}'`,
    );
  }
};

//callback for when event message is recieved and this method takes in the event message for the midi
const onMIDIMessage = (event: MIDIMessageEvent) => {

  // data is the array it's a uint8 array which means each item is a byte (8 digits per entry)
  // the length of the array is 3 so all the valueof lines allow us to get the command, note, and velocity, from
  // that array for the midi
  const data = event.data as Uint8Array;

  // write a message to the console about this MIDI event
  // this method is the press or release we do on the keyboard and whatever midi we do
  // the timestamp is useful if we care about recreating or recording the audio 
  // sometimes we may want to record this for playback but if we don't we don't need this time stamp
  let str = `MIDI message received at timestamp ${event.timeStamp}[${data.length} bytes]: `;
  for (const character of data) {
    //10 is the radix its what base number system we write it in (this is base 10 which is the numeric 
    //numbers so we can make it readable)
    str += `${character.toString(10)} `;
  }
  //the last 4 numbers are different channels (would not be 0 for different channels)
  //a node on event is 144 is we do 10010000 for channel 0 (we have different channels for different instruments, tracks, etc.)
  //if we did not have channels we would be playing everything everywhere 
  //if we had channels then when we play something it will only play that instrument based on the channel**
  console.log(str);

  // Pull the command, note, and velocity from the data
  // https://midi.org/summary-of-midi-1-0-messages
  // .at is part of the unit8 array and it can use this to get a value at an index
  // valueof defaults to base 10 thats why we can use it in the conditional to play an audio if it's 144
  let command = data.at(0)?.valueOf()!;
  let note = data.at(1)?.valueOf()!;
  let velocity = data.at(2)?.valueOf()! / 100;

  // what does this mean and what does this do
  // 144 maps to a Note-On event on MIDI Channel 1
  if (command === 144) {
    // play the note at the given velocity
    playNote(note, velocity);
  }

  // Fun fact - depending on the device:
  // (Note Off) is the same as (Note On with Velocity 0)
  // this happened in our demo because we did command 144 but 128 would have the note off (some devices do it different ways)

};

const playNote = (note: number, velocity: number) => {
  // note number/name/frequency chart:
  // https://newt.phys.unsw.edu.au/jw/notes.html

  //tone.now() gets the time we would like the tone to occur (we use this in line 94 to so triggerAttack at a certain
  //time with a certain frequency)
  let now = Tone.now();

  // Tone.Midi(note) : converts a midi note number to a usable frequency value
  //goes to a freqeuncy in hertz for tone (tone would take in a string like A1, A0, etc. but we convert from
  //uint 8 to use frequencies so we can play it with tone)
  let frequency = Tone.Midi(note);

  if (velocity !== 0) {
    // this is a note-on event

    // get the next available synth from the pool
    // the synth can play one note at a time so if we want to play multiple notes we have to have multiple synths
    // we have to get the next item to play the synth then we get the next item and keep going
    // instead of having an unlimited amount of synths we have a pool of them and use the next one in line everytime we press
    // a note (we skip the first note when we say skip it but then we catch it on the next loop on synths)
    // if we had 5 keys it skips the first one and does 4 of them then we stop the loop then the next time we press the keys
    // we use that value we did not use and use it with the rest of the synths we have lined up
    let activeSynth = synthPool.nextItem();
    //we want to turn this note off later so we set the synth equal to that note we are playing 
    //we get the 90th index and we set that to active synth and it plays so we set activesynth to the note in the array
    //then use that in the else to turn it off when we stop pressing the key
    //the activesynth stays in the note and we just override it if we play the note again when we enter this conditional
    synthsByNote[note] = activeSynth;
    // actually cause audio to be played
    // this plays the audio at the frequency at this time and velocity (effects how loud the audio is with more velocity)
    activeSynth.triggerAttack(frequency, now, velocity);
    // update the <li> to show the key is active 
    // we change this in the console to say we are playing this note
    keysByNote[note].classList.add('playing');
  } else {
    // this is a note-off event

    // get the synth that last played the note
    // we turn the note off when we are done playing (this is the one we started playing because we just targetted the note
    // with the index)
    synthsByNote[note].triggerRelease(now);

    // update the <li> to show the key is no longer active
    // don't show the playing with the key we just pressed when we are done
    keysByNote[note].classList.remove('playing');
  }
};

// actually request access to the MIDI devices connected to this computer
navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

//tone.synth is the data type the circular pool will use (defining variables or parameters they are generics as well)
//this is a tone.synth instance of this generic class
let synthPool: CircularPool<Tone.Synth>;
let synthsByNote: Tone.Synth[] = [];
const beginButton = document.querySelector('#beginButton') as HTMLButtonElement;

// To play audio in the browser, we have to respond to a click event (or other user input)
// No autoplay allowed!
// we want a promise in this because we have to wait for tone.start() for all the audios to load
// otherwise it will not work
beginButton.addEventListener('click', async () => {
  // Tone handles initializing the audio context and all that
  // we want the audios we have in tone to exist right now when we press the begin button
  await Tone.start();

  // Hide the beginButton (but as visibility hidden so it doesn't make the layout jump)
  beginButton.style.visibility = 'hidden';

  // Create a CircularPool holding 10 Tone.Synth objects, ready to use
  // create a circular pool that stores tone.synth (stores 10 items in the array)
  // the function itembuilder lets us get a fresh instance of the thing it stores (make a circular
  // pool of tone synths and here is a function to make one of them and make 10 of these in a row) 
  synthPool = makeCircularPool<Tone.Synth>(10, () =>
    new Tone.Synth().toDestination(),
  );

  // Generate the DOM <li> elements that make our on-screen keyboard
  // set up all our keys initially 
  // we are just handing the method to the setupkeyboard funciton so it can use it to play notes on the screen
  setupKeyboard(playNote);
});

/**
 * NEW NOTES:
 * 
 * submillisecond is smaller than millisecond and it gives us a fraction of a millisecond for midi
 * dimming is like triggers on a game controller or pressure sensitivity like veloicty but not
 * 
 * for keynote and velocity the first number is always 0
 * 
 * in out code we stopped at 108 but if we had more things in the array it would be undefined
 * 
 * on line 112 on GitHub the synthsbynote says this synth was used to play this note (this was the synth to play this note)
 * if we play 10 notes the synths by note will have 10 differnt notes and synths note and if we have an 11th note 
 * then it goes back to the first entry and overrrides as we get new notes for each 10 elements (this is the same as 
 * the keyboard array because it uses the note to store something and its used when the note is played)
 * 
 * if we play through and we run out then we increase the pool size ourself while we are writing in our code 
 * and if we had a good way to say if we are done doing this thing we could add to this array if needed instead but if we
 * save the itembuilder into a variable then called increase pool size by calling itembuilder 5 times to increase the size of the array
 * we would do this in main as well
 * 
 * if something was still playing and it was not finished or we had a long sample instead of synths then
 * it would not be ready for use then (the sound would get cut off if we want to reuse the same audio and it was not done)
 * 
 * index is 9 and the index 10 divided by size is 0 and the index becomes 0 and we reuse the array when the 10 items are reached
 * and we pull each index as we go through to play an audio to override the current index 
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

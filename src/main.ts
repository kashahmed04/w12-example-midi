import { CircularPool, makeCircularPool } from './circularPool';
import { keysByNote, setupKeyboard } from './keyboard';
import './reset.css';
import './styles.css';

import * as Tone from 'tone';

// when we are allowed to use MIDI
const onMIDISuccess = (midi: MIDIAccess) => {
  console.log('MIDI ready!');

  // show which devices are connected
  listInputsAndOutputs(midi);

  // start listening for MIDIMessages on all devices
  midi.inputs.forEach((input: MIDIInput) => {
    input.onmidimessage = onMIDIMessage;
  });
};

// when we cannot use MIDI for some reason
const onMIDIFailure = (reason: any) => {
  console.error(`Failed to get MIDI access - ${reason}`);
};

const listInputsAndOutputs = (midi: MIDIAccess) => {
  // if we were doing this for real...
  // we'd want to expose these midi.inputs as possible selections from a dropdown menu
  // so the user could choose between multiple MIDI devices on their machine

  // FOR EXAMPLE - at home I have a Loupedeck CT
  // and that registers as a MIDI device, despite not being music-related
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

  for (const entry of midi.outputs) {
    const output = entry[1];
    console.log(
      `Output port [type:'${output.type}'] id:'${output.id}' manufacturer:'${output.manufacturer}' name:'${output.name}' version:'${output.version}'`,
    );
  }
};

const onMIDIMessage = (event: MIDIMessageEvent) => {
  const data = event.data as Uint8Array;

  // write a message to the console about this MIDI event
  let str = `MIDI message received at timestamp ${event.timeStamp}[${data.length} bytes]: `;
  for (const character of data) {
    str += `${character.toString(10)} `;
  }
  console.log(str);

  // Pull the command, note, and velocity from the data
  // https://midi.org/summary-of-midi-1-0-messages
  let command = data.at(0)?.valueOf()!;
  let note = data.at(1)?.valueOf()!;
  let velocity = data.at(2)?.valueOf()! / 100;

  // 144 maps to a Note-On event on MIDI Channel 1
  if (command === 144) {
    // play the note at the given velocity
    playNote(note, velocity);
  }

  // Fun fact - depending on the device:
  // (Note Off) is the same as (Note On with Velocity 0)
};

const playNote = (note: number, velocity: number) => {
  // note number/name/frequency chart:
  // https://newt.phys.unsw.edu.au/jw/notes.html
  let now = Tone.now();

  // Tone.Midi(note) : converts a midi note number to a usable frequency value
  let frequency = Tone.Midi(note);

  if (velocity !== 0) {
    // this is a note-on event

    // get the next available synth from the pool
    let activeSynth = synthPool.nextItem();
    // remember it as the synth that has played the note (store in synthsByNote)
    synthsByNote[note] = activeSynth;
    // actually cause audio to be played
    activeSynth.triggerAttack(frequency, now, velocity);
    // update the <li> to show the key is active
    keysByNote[note].classList.add('playing');
  } else {
    // this is a note-off event

    // get the synth that last played the note
    synthsByNote[note].triggerRelease(now);

    // update the <li> to show the key is no longer active
    keysByNote[note].classList.remove('playing');
  }
};

// actually request access to the MIDI devices connected to this computer
navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

let synthPool: CircularPool<Tone.Synth>;
let synthsByNote: Tone.Synth[] = [];
const beginButton = document.querySelector('#beginButton') as HTMLButtonElement;

// To play audio in the browser, we have to respond to a click event (or other user input)
// No autoplay allowed!
beginButton.addEventListener('click', async () => {
  // Tone handles initializing the audio context and all that
  await Tone.start();

  // Hide the beginButton (but as visibility hidden so it doesn't make the layout jump)
  beginButton.style.visibility = 'hidden';

  // Create a CircularPool holding 10 Tone.Synth objects, ready to use
  synthPool = makeCircularPool<Tone.Synth>(10, () =>
    new Tone.Synth().toDestination(),
  );

  // Generate the DOM <li> elements that make our on-screen keyboard
  setupKeyboard(playNote);
});

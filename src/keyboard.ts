// a sparse array to store our <li> elements
// so we are declaring an array of list elements for each key right**
export const keysByNote: HTMLLIElement[] = [];

export const setupKeyboard = (
  //why do we have two playnotes one in main and one in keyboard** (what is the difference between each)**
  playNote: (note: number, velocity: number) => void,
) => {
  // are we dragging the mouse?
  // why did we need this**
  let isMouseDown = false;

  // the <ul> in index.html
  const keyboard = document.querySelector('#keyboard') as HTMLUListElement;

  // make a bunch of keys objects
  // so this makes everything in the array before 21 be blank and undefined right (how do we know the array is 
  // sparse do we have to say anything specific or can we just start filling the array from anywhere)**
  // after the 108th element it does not get filled in anymore right only 
  // the elements before 21 are undefined right for sparse arrays**
  for (let i = 21; i < 109; i++) {
    const li = document.createElement('li');
    li.className = 'key';
    keyboard.appendChild(li);

    // store it in the sparse array
    //we have one array we made in the HTML which was our keyboard then our keysbynote was used for**
    //why did we have 2 arrays** (we only use keysbynote in the main.TS but not the keyboard list)**
    keysByNote[i] = li;

    // a helper variable for setting up the black keys
    // we target these black keys because after these keys for modulo when we do modulo 12 again
    // it resets to 0 so it will always be these keys that are black**
    let blackKeyRef = (i - 21) % 12;
    if (
      blackKeyRef === 1 ||
      blackKeyRef === 4 ||
      blackKeyRef === 6 ||
      blackKeyRef === 9 ||
      blackKeyRef === 11
    ) {
      // a black key is styled differently based on the presence of this class:
      // so we have the keys all start as white then we add this class name to each black key based on the conditional right**
      // we define the class list for the list element that has the black key so it applies the styles from the CSS to these black
      // keys only**
      li.classList.add('black');
    }

    li.onmousedown = () => {
      // play a note when pressing the mouse on this key
      // we play note for the specific index we have pressed down)** (how does it know if we already finish creating all the keys 
      // which key it is when we press is with the mouse)** 
      // (is it because we attach an event to each key (these count as events right), 
      // if so how would it know the index for play note still)**
      isMouseDown = true;
      playNote(i, 1);
    };

    li.onmouseenter = () => {
      if (isMouseDown) {
        // only play a note if the mouse is being held down
        //what is the difference between the first method and the second method)**
        //so everything in this loop gets attached to each list element (the piano keys)**
        playNote(i, 1);
      }
    };

    li.onmouseup = () => {
      // stop playing the note
      //what is the difference between these to methods**
      isMouseDown = false;
      playNote(i, 0);
    };

    li.onmouseleave = () => {
      // stop playing the note
      playNote(i, 0);
    };
  }

  // a mouseup anywhere on the page
  // why would we need this here if we already had a mouse up above** (difference between this mouse up and previous mouse up)**
  document.body.onmouseup = () => {
    isMouseDown = false;
    // has us stopping all active notes
    // how do we stop playing if we call play note**
    // go over how this works in main (which playnote does it go to the one in main or this one here)**
    for (let i = 21; i < 109; i++) {
      playNote(i, 0);
    }
  };
};

// a sparse array to store our <li> elements
// so we are declaring an array of list elements for each key right
export const keysByNote: HTMLLIElement[] = [];

export const setupKeyboard = (
  playNote: (note: number, velocity: number) => void,
) => { //play note is a function that follows this method signature so its like defining a type
  //we need to define this otherwise we would get a type error
  // are we dragging the mouse?
  let isMouseDown = false;

  // the <ul> in indexhtml
  const keyboard = document.querySelector('#keyboard') as HTMLUListElement;

  // make a bunch of keys objects
  for (let i = 21; i < 109; i++) {
    const li = document.createElement('li');
    li.className = 'key';
    keyboard.appendChild(li);

    // store it in the sparse array 
    keysByNote[i] = li;

    // a helper variable for setting up the black keys
    // we target these black keys because after these keys for modulo when we do modulo 12 again
    // it resets to 0 so it will always be these keys that are black
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
      // keys only
      li.classList.add('black');
    }

    li.onmousedown = () => {
      // this will play the note because it knows about this index when the event is attached to the item
      isMouseDown = true;
      playNote(i, 1);
    };

    li.onmouseenter = () => {
      if (isMouseDown) {
        // only play a note if the mouse is being held down
        // this is for when we press and hold to play the audio
        playNote(i, 1);
      }
    };

    li.onmouseup = () => {
      // stop playing the note
      // this is when we click the element once 
      isMouseDown = false;
      playNote(i, 0);
    };

    li.onmouseleave = () => {
      // stop playing the note
      // stop playing when we stop dragging 
      playNote(i, 0);
    };
  }

  // a mouseup anywhere on the page
  document.body.onmouseup = () => {
    isMouseDown = false;
    //this stops the clicking when we drag into the background when we drag on the keyboard
    //we need this loop because we don't know which key we have left to go to background so we turn all of them off 
    for (let i = 21; i < 109; i++) {
      playNote(i, 0);
    }
  };
};

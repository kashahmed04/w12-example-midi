// a sparse array to store our <li> elements
export const keysByNote: HTMLLIElement[] = [];

export const setupKeyboard = (
  playNote: (note: number, velocity: number) => void,
) => {
  // are we dragging the mouse?
  let isMouseDown = false;

  // the <ul> in index.html
  const keyboard = document.querySelector('#keyboard') as HTMLUListElement;

  // make a bunch of keys objects
  for (let i = 21; i < 109; i++) {
    const li = document.createElement('li');
    li.className = 'key';
    keyboard.appendChild(li);

    // store it in the sparse array
    keysByNote[i] = li;

    // a helper variable for setting up the black keys
    let blackKeyRef = (i - 21) % 12;
    if (
      blackKeyRef === 1 ||
      blackKeyRef === 4 ||
      blackKeyRef === 6 ||
      blackKeyRef === 9 ||
      blackKeyRef === 11
    ) {
      // a black key is styled differently based on the presence of this class:
      li.classList.add('black');
    }

    li.onmousedown = () => {
      // play a note when pressing the mouse on this key
      isMouseDown = true;
      playNote(i, 1);
    };

    li.onmouseenter = () => {
      if (isMouseDown) {
        // only play a note if the mouse is being held down
        playNote(i, 1);
      }
    };

    li.onmouseup = () => {
      // stop playing the note
      isMouseDown = false;
      playNote(i, 0);
    };

    li.onmouseleave = () => {
      // stop playing the note
      playNote(i, 0);
    };
  }

  // a mouseup anywhere on the page
  document.body.onmouseup = () => {
    isMouseDown = false;
    // has us stopping all active notes
    for (let i = 21; i < 109; i++) {
      playNote(i, 0);
    }
  };
};

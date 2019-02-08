// Copyright 2019, Matthew Pennington

const LETTERS_TYPE = 'letters';
const NUMBERS_TYPE = 'numbers';

const flip = ( $card, reveal ) => {
  $card.flip( reveal );
  $card.find( '.back' ).attr( 'tabindex', reveal ? 0 : -1 );
  $card.find( '.front' ).attr( 'tabindex', reveal ? -1 : 0 );
  $card.find( reveal ? '.back' : '.front' ).focus();
}

/**
 * @param {string} type - one of LETTERS_TYPE or NUMBERS_TYPE
 * @param {int} size - should be an even number
 *
 * Initializes the cards and conditions for a memory game of dimensions size * size 
 */
const init = ( type, size ) => {
  // Reset play area
  $( '#play' ).empty();

  // Initialize game values
  let upOne = null; // id of first card flipped
  let upTwo = null; // id of second card flipped
  let cardsUp = 0; // number of cards flipped, in range [0, 2]
  let matches = 0; // number of matches made by the player, used to check win conditions

  // Check for errors
  if ( size % 2 !== 0  && size >= 2 && size <= 8 ) {
    throw 'Invalid size.'
  }
  if ( ![ LETTERS_TYPE, NUMBERS_TYPE ].includes( type ) ) {
    throw 'Invaid type.'
  }

  // Create card values
  const numCards = size * size / 2;
  let cards = []
  for ( let i = 1; i <= numCards; i++ ) {
    let card;
    if ( type === NUMBERS_TYPE ) {
      card = i
    }
    else if ( type === LETTERS_TYPE ) {
      card = String.fromCharCode( 64 + i )
    }
    cards.push( card );
    cards.push( card );
  }
  cards = _.shuffle( cards );

  // Generate card elements
  const cardsCopy = cards.slice( 0 );
  for ( let row = 1; row <= size; row++ ) {
    let rowElement = document.createElement( 'div' );
    rowElement.classList.add( 'row-' + row );
    rowElement.classList.add( 'row' );

    for ( let col = 1; col <= size; col++ ) {
      const cardValue = cardsCopy.pop();
      const cardId = cardsCopy.length;

      const front = document.createElement( 'div' );
      $( front ).attr( 'role', 'button' );
      $( front ).attr( 'tabindex', '0' );
      $( front ).attr( 'aria-label', 'Card number ' + cardId + ', unrevealed' );
      front.classList.add( 'front' )
      const star = document.createElement( 'i' );
      star.classList.add( 'fa' );
      star.classList.add( 'fa-star' );
      front.append( star );

      const back = document.createElement( 'div' );
      $( back ).attr( 'role', 'button' );
      $( back ).attr( 'tabindex', '-1' );
      $( back ).attr( 'aria-label', 'Card number ' + cardId + ', card value is ' + cardValue );
      back.classList.add( 'back' )
      back.append( cardValue );
      
      const playCard = document.createElement( 'div' );
      playCard.id = 'playCard-' + cardId;
      playCard.classList.add( 'card' );
      playCard.classList.add( 'play' );
      playCard.append( front );
      playCard.append( back );
      $( playCard ).flip( { trigger: 'manual' } );

      const successCard = document.createElement( 'div' );
      successCard.id = 'successCard-' + cardId;
      successCard.classList.add( 'card' );
      successCard.classList.add( 'hidden' );
      successCard.classList.add( 'success' );
      const check = document.createElement( 'i' );
      check.classList.add( 'fa' );
      check.classList.add( 'fa-check-circle' );
      successCard.append( check );

      const container = document.createElement( 'div' );
      container.classList.add( 'col-' + col );
      container.append( playCard );
      container.append( successCard );

      rowElement.append( container );
    }
    $( '#play' ).append( rowElement );
  }

  $( '.card' ).on( 'keypress', event => {
    if ( event.keyCode === 13 || event.keyCode === 32 ) {
      $( event.target ).click();
    }
  } );

  // Define event handling for card clicks
  $( '.card' ).click( event => {
    const $target = $( event.target )
    const $card = $target.closest( '.card' );
    const $back = $target.closest( '.back' );
    const $front = $target.closest( '.front' );

    // Back was clicked, hiding card
    if ( $back[ 0 ] ) {
      if ( cardsUp <= 2 && cardsUp > 0 ) {
        cardsUp--;
        flip( $card, false );
      }
    }
    
    // Front was clicked, revealing card
    else if ( $front[ 0 ] ) {
      cardsUp++;

      // The first card was flipped. Remember it and let the user continue
      if ( cardsUp === 1 ) {
        flip( $card, true );
        upOne = $card.attr( 'id' );
        cardsUp = 1;
      }

      // A second card was flipped
      else if ( cardsUp === 2 ) {
        // Allow the flip to occur
        flip( $card, true );
        upTwo = $card.attr( 'id' );

        // Extract the card values
        const valOne = cards[ upOne.replace( 'playCard-', '' ) ];
        const valTwo = cards[ upTwo.replace( 'playCard-', '' ) ];

        // If there is a match, replace the cards with success placeholders
        if ( valOne === valTwo ) {
          setTimeout( () => {
            $( '#' + upOne ).fadeOut( 300, () => { 
              $( '#' + upOne.replace( 'play', 'success' ) ).fadeIn( 300 );
              upOne = null;
            } );
            $( '#' + upTwo ).fadeOut( 300, () => {
              $( '#' + upTwo.replace( 'play', 'success' ) ).fadeIn( 300 );
              upTwo = null;
              cardsUp = 0;
            } );

            // Check for win conditions
            matches++;
            if ( matches >= ( cards.length / 2 ) ) {
              const winBanner = document.createElement( 'h2' )
              winBanner.innerText = 'You Win!!!'
              $( '#play' ).append( winBanner );
            }
          }, 1000)
        }

        // A match was not detected, flip the cards back and continue afterwards.
        else {
          setTimeout( () => {
            flip( $( '#' + upOne ), false );
            flip( $( '#' + upTwo ), false );
            upOne = null;
            upTwo = null;
            cardsUp = 0;            
          }, 1000)
        }
      }

      // 2 cards are already visible, do nothing but wait for the timeouts
      else {}
    }
    
    // successCard was clicked - do nothing
    else {}

  } );
}

let selectedRow = 0; // Row in the game board that has ben selected using keyboard shortcuts
let selectedCol = 0; // Column in the game board that has ben selected using keyboard shortcuts

/**
 * Removes selected class and resets row/col selections
 */
const clearFocus = () => {
  selectedRow = 0;
  selectedCol = 0;
  $( '.selected' ).removeClass( 'selected' );
}

// Define behavior for custom keyboard shortcuts
$( document ).keypress( event => {
  const key = event.key;

  // Behavior for revealing a card 
  if ( key === 'f' || key === 'F' ) {
    const $card = $( '.row-' + selectedRow + ' .col-' + selectedCol + ' .card' )
    if ( $card[ 0 ] ) {
      const $side = $card.find( $card.data( 'flip-model' ).isFlipped ? '.back' : '.front' )
      console.log( $side);
      $side.click();
      clearFocus()
    }
  }

  // Behavior to simply clear any focus
  if ( key === 'c' || key === 'C' ) {
    clearFocus()
  }

  //Behavior to define selection
  else if ( key > 0 && key < 10 ) {

    // User selected a column.  Highlight a single card
    if ( selectedRow !== 0 ) {
      $( '.row-' + selectedRow ).removeClass( 'selected' );
      $( '.row-' + selectedRow + ' .col-' + key ).addClass( 'selected' );
      selectedCol = key;
    }

    // User selected a row, Highlight all cards in the row.
    else {
      $( '.row-' + key ).addClass( 'selected' );
      selectedRow = key;
    }
  }
} );

// Behavior for drawers on small screens
$( '#control-toggle' ).click( () => {
  $('#controls').toggle();
  $('#help').hide() 
} );
$( '#help-toggle' ).click( () => {
  $('#controls').hide();
  $('#help').toggle() 
} );

// Ensure appropriate elements are shown based on screen size
const resetScreen = () => {
  console.log( 'ack' )
  if ( window.matchMedia( '(min-width: 1101px)' ).matches ) {
    $('#controls').show();
    $('#help').show() 
  }
  else {
    $('#controls').hide();
    $('#help').hide() 
  }
}

// Show or hide side panels on document resize
$( window ).resize( () => resetScreen() );

// Start a new game
$( '#start' ).click( () => {
  const size = $('#size-select').val();
  const type = $('#type-select').val();
  const proceed = confirm( 'Do you want to start a new game?' );
  if ( proceed ) {
    init( type, size );
    resetScreen();
  }
} );

// Start the app with a game ready to play!
$( document ).ready( () => {
  init( LETTERS_TYPE, 4 );
} );
"use strict";

window.addEventListener("load",function() {

  const sqWidthMin = 5; // length of square side 5..sqWidthMax
  const sqWidthMax = 10; // length of square side sqWidthMin..50
  const DHUE = 1; // integer 1-10 - hue change by step
  const DLUM = 1; // 0.1 - 5 - lightness change by step
  const SPEED = 0.1; // 0 to 100
  const MARGIN = 0.5; // black marging around each square

  let canv, ctx;    // canvas and context

  let maxx, maxy;   // canvas dimensions

  let sqWidth, sqRad;  // square side length, quarter of circle radius (1/2 sqWidth)
  let grid;
  let nbx, nby;
  let hnbx, hnby; // number of squares in the half of the width, height of the canvas

  let groups;
  let listReachable;

// for animation

  let events;
  let colorMode;

// shortcuts for Math.
  const mrandom = Math.random;
  const mfloor = Math.floor;
  const mround = Math.round;
  const mceil = Math.ceil;
  const mabs = Math.abs;
  const mmin = Math.min;
  const mmax = Math.max;

  const mPI = Math.PI;
  const mPIS2 = Math.PI / 2;
  const mPIS3 = Math.PI / 3;
  const m2PI = Math.PI * 2;
  const m2PIS3 = Math.PI * 2 / 3;
  const msin = Math.sin;
  const mcos = Math.cos;
  const matan2 = Math.atan2;

  const mhypot = Math.hypot;
  const msqrt = Math.sqrt;

  const rac3   = msqrt(3);
  const rac3s2 = rac3 / 2;

//------------------------------------------------------------------------

function alea (mini, maxi) {
// random number in given range

  if (typeof(maxi) == 'undefined') return mini * mrandom(); // range 0..mini

  return mini + mrandom() * (maxi - mini); // range mini..maxi
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function intAlea (mini, maxi) {
// random integer in given range (mini..maxi - 1 or 0..mini - 1)
//
  if (typeof(maxi) == 'undefined') return mfloor(mini * mrandom()); // range 0..mini - 1
  return mini + mfloor(mrandom() * (maxi - mini)); // range mini .. maxi - 1
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function randomElement(array) {
    return array[intAlea(0, array.length)];
  }
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function arrayShuffle (array) {
/* randomly changes the order of items in an array
   only the order is modified, not the elements
*/
  let k1, temp;
  for (let k = array.length - 1; k >= 1; --k) {
    k1 = intAlea(0, k + 1);
    temp = array[k];
    array[k] = array[k1];
    array[k1] = temp;
    } // for k
  return array
  } // arrayShuffle


//------------------------------------------------------------------------

function Square (kx, ky, color) {

/* constructor */

  this.color = color ? color : `hsl(${intAlea(360)},100%,50%)`;
  this.kx = kx;
  this.ky = ky;
  this.kxc = kx - hnbx;
  this.kyc = ky - hnby;

  this.xc = maxx / 2 + this.kxc * sqWidth; // center of square
  this.yc = maxy / 2 + this.kyc * sqWidth;

} // Square
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

Square.prototype.fillSquare = function (evolColor) {

  const side = sqWidth - MARGIN;
  const hSide = side / 2;

  this.evolColor = evolColor; // just to mark square as drawn
  ctx.fillStyle = `hsl(${evolColor.hue}, 100%,${evolColor.lum}% )`;
  ctx.fillRect (this.xc - hSide, this.yc - hSide, side, side);

} // Square.prototype.fillSquare

//------------------------------------------------------------------------

  function nextColor(evolColor) {

    let hue = evolColor.hue;
    let dhue = evolColor.dhue;
    let lum = evolColor.lum;
    let dlum = evolColor.dlum;
    let width = evolColor.width;
    let dWidth = evolColor.dWidth;

    let color;
    switch (colorMode) {
      case 0:
        color = `hsl(${hue},100%,50%)`;
        hue = (hue + dhue) % 360;
        break;
      case 1:
        color = `hsl(${hue},100%,${lum}%)`;
        lum += dlum;
        if (lum > 80) dlum = -mabs(dlum);
        if (lum < 40) dlum = mabs(dlum);
        break;
      case 2:
        color = `hsl(${hue},100%,${lum}%)`;
        lum += dlum;
        if (lum > 80) dlum = -mabs(dlum);
        if (lum < 40) dlum = mabs(dlum);
        hue = (hue + dhue) % 360;
        break;

    } // switch
    width += dWidth;
    if (width > 2.5) dWidth = -mabs(dWidth);
    if (width < 0.5) dWidth = mabs(dWidth);

    return {hue: hue, dhue: dhue,
            lum: lum, dlum: dlum,
            width: width, dWidth: dWidth,
            color: color};
  } // returnColor

//------------------------------------------------------------------------

let animate;

{ // scope for animate

let animState = 0;
let listReachable;
let currCell, evolColor;

animate = function(tStamp) {

  let tinit;
  let event;
  let neighGroups;

  event = events.pop();
  if (event && event.event == 'reset') animState = 0;
  if (event && event.event == 'click') animState = 0;
  window.requestAnimationFrame(animate)

  tinit = performance.now();
  do {

    switch (animState) {

      case 0 :
        if (startOver()) {
          ++animState;
          evolColor = {};
          evolColor.hue = intAlea(360);
          evolColor.dhue = intAlea(2) ? DHUE : (360 - DHUE);
          evolColor.lum = intAlea(40,80);
          evolColor.dlum = intAlea(2) ? -DLUM : DLUM;
          evolColor.width = alea(0.5, 2.5);
          evolColor.dWidth = 0.1;
          evolColor = nextColor(evolColor);
        }
        break;

      case 1:
          currCell = grid[hnby][hnbx];
          listReachable = [currCell];
          ++animState;

      case 2 :
        if (listReachable.length == 0) {
          animState += 10; // finished !
          break;
        }
        currCell = listReachable.shift();
        if (!currCell.evolColor) ++animState;
       else break;

      case 3 :
        evolColor = nextColor(evolColor);
        currCell.group.forEach (cell => cell.fillSquare(evolColor));
// make list of all neighbour groups
        neighGroups = new Set();
        currCell.group.forEach (cell => {
          cell.neighbours.forEach (neighCell => {
            if (! neighCell.evolColor) // keep only undrawn cells;
              neighGroups.add(neighCell.group);
          }); // cell.neighbours.forEach
        }); // currCell.group.forEach

        if (neighGroups.size == 0){ // no neighbours available
          --animState; // go back and fetch in listReachable
          break;
        }

// put those groups in a random order
        neighGroups = arrayShuffle([...neighGroups]); // change into Array

        for (let k = 1; k < neighGroups.length; ++k) {
            listReachable.push([...(neighGroups[k])][0]); // push 1 cell of every group - but first
        }
        currCell = [...(neighGroups[0])][0]; // 1st cell of 1st group is next current cell
        break;

    } // switch
  } while ((animState == 2 || animState == 3) && (performance.now() - tinit < SPEED));

} // animate
} // scope for animate

//------------------------------------------------------------------------

function createGrid() {

  let kx1, ky1, cell;

  grid = [];

  for (let ky = 0; ky < nby; ++ky) {
    grid[ky] = [];
    for (let kx = 0; kx < nbx; ++kx) {
      grid[ky][kx] = new Square (kx, ky);
    } // for kx
  } // for ky

// calculate neighbours
  for (let ky = 0; ky < nby; ++ky) {
    for (let kx = 0; kx < nbx; ++kx) {
      cell = grid[ky][kx];
      cell.neighbours = [];
      ky1 = ky - 1; // neighbour side 0
      if (ky1 >= 0) cell.neighbours[0] = grid[ky1][kx];
      kx1 = kx + 1; // neighbour side 1
      if (kx1 < nbx ) cell.neighbours[1] = grid[ky][kx1];
      ky1 = ky + 1; // neighbour side 2
      if (ky1 < nby) cell.neighbours[2] = grid[ky1][kx];
      kx1 = kx - 1; // neighbour side 3
      if (kx1 >= 0) cell.neighbours[3] = grid[ky][kx1];
    }; // for kx
  }; // for ky

// create groups

  for (let ky = 0; ky < nby; ++ky) {
    for (let kx = 0; kx < nbx; ++kx) {
      cell = grid[ky][kx];
      if (cell.group) continue;
      cell.group = new Set([cell]);  // myself
      addToGroup (cell.group, hnbx - cell.kxc, cell.ky);
      addToGroup (cell.group, cell.kx, hnby - cell.kyc);
      addToGroup (cell.group, hnbx - cell.kxc,  hnby - cell.kyc);
      addToGroup (cell.group, hnbx + cell.kyc, hnby + cell.kxc);
      addToGroup (cell.group, hnbx + cell.kyc, hnby - cell.kxc);
      addToGroup (cell.group, hnbx - cell.kyc, hnby + cell.kxc);
      addToGroup (cell.group, hnbx - cell.kyc, hnby - cell.kxc);
    }; // for kx
  }; // for ky

} // createGrid

//------------------------------------------------------------------------
function addToGroup (group, kx, ky) {
  if (kx < 0 || ky < 0 || kx >= nbx || ky >= nby) return; // out of grid, do not add
  group.add(grid[ky][kx]);
  grid[ky][kx].group = group;
} // addToGroup

//------------------------------------------------------------------------

  function nextColor(evolColor) {

    let hue = evolColor.hue;
    let dhue = evolColor.dhue;
    let lum = evolColor.lum;
    let dlum = evolColor.dlum;
    let width = evolColor.width;
    let dWidth = evolColor.dWidth;

    let color;
    switch (colorMode) {
      case 0:
        color = `hsl(${hue},100%,50%)`;
        hue = (hue + dhue) % 360;
        lum = 50;
        break;
      case 1:
        color = `hsl(${hue},100%,${lum}%)`;
        lum += dlum;
        if (lum > 80) dlum = -mabs(dlum);
        if (lum < 40) dlum = mabs(dlum);
        break;
      case 2:
        color = `hsl(${hue},100%,${lum}%)`;
        lum += dlum;
        if (lum > 80) dlum = -mabs(dlum);
        if (lum < 40) dlum = mabs(dlum);
        hue = (hue + dhue) % 360;
        break;

    } // switch
    width += dWidth;
    if (width > 2.5) dWidth = -mabs(dWidth);
    if (width < 0.5) dWidth = mabs(dWidth);

    return {hue: hue, dhue: dhue,
            lum: lum, dlum: dlum,
            width: width, dWidth: dWidth,
            color: color};
  } // returnColor

//------------------------------------------------------------------------

function startOver() {

// canvas dimensions

  maxx = window.innerWidth;
  maxy = window.innerHeight;

  canv.width = maxx;
  canv.height = maxy;
  ctx.lineJoin = 'bevel';
  ctx.lineCap = 'round';

  sqWidth = alea(sqWidthMin, sqWidthMax);
  sqRad = sqWidth / 2;

  hnby = mfloor (maxy / sqWidth / 2); // the full array has 2 * hnbx + 1 rows
  hnbx = mfloor (maxx / sqWidth / 2);
  nbx = 1 + 2 * hnbx;
  nby = 1 + 2 * hnby;

  if (nbx < 3 || nby < 3) return false;
  ctx.clearRect(0,0,maxx,maxy);

  colorMode = intAlea(3);
  createGrid();

  return true;

} // startOver

//------------------------------------------------------------------------

function mouseClick (event) {

  events.push({event:'click'});;

} // mouseMove

//------------------------------------------------------------------------
//------------------------------------------------------------------------
// beginning of execution

  {
    canv = document.createElement('canvas');
    canv.style.position="absolute";
    document.body.appendChild(canv);
    ctx = canv.getContext('2d');
    canv.setAttribute ('title','click me');
  } // création CANVAS
  canv.addEventListener('click',mouseClick); // just for initial position
  events = [{event:'reset'}];
  requestAnimationFrame (animate);

}); // window load listener
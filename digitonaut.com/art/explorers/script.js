"use strict";

window.addEventListener("load", function () {
  const area = 200; // average number of cells for each explorer
  const step = 5;
  const margin = 0.6; // should be kept small - suggest 0 to 1
  const side = step - margin;

  let canv, ctx; // canvas and context
  let maxx, maxy; // canvas sizes (in pixels)

  let grid; // arrays of cells
  let explorers; // array of explorers

  let xDisp, yDisp; // pre-computed positions of cells on display
  let nbx, nby; // grid size (in elements, not pixels)

  // for animation
  let animState;

  // shortcuts for Math.…

  const mrandom = Math.random;
  const mfloor = Math.floor;
  const mround = Math.round;
  const mceil = Math.ceil;
  const mabs = Math.abs;
  const mmin = Math.min;
  const mmax = Math.max;
  //-----------------------------------------------------------------------------
  // miscellaneous functions
  //-----------------------------------------------------------------------------

  function alea(min, max) {
    // random number [min..max[ . If no max is provided, [0..min[

    if (typeof max == "undefined") return min * mrandom();
    return min + (max - min) * mrandom();
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  function intAlea(min, max) {
    // random integer number [min..max[ . If no max is provided, [0..min[

    if (typeof max == "undefined") {
      max = min;
      min = 0;
    }
    return mfloor(min + (max - min) * mrandom());
  } // intAlea

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  function randomElement(array) {
    return array[intAlea(array.length)];
  } // randomElement

  //-----------------------------------------------------------------------------
  function drawCell(kx, ky, occupied) {
    // occupied means that an explorer is currently present in the cell

    let exp = explorers[grid[ky][kx]];
    let lum = occupied ? ((exp.lum < 50) ? 80 : 30) : exp.lum;
    ctx.fillStyle = `hsl(${exp.hue},100%,${lum}%)`;
    ctx.fillRect(xDisp[kx], yDisp[ky], side, side);
  } // drawCell

  //----------------------------------------------------------------------------

  function createGrid() {
    grid = [];
    for (let ky = 0; ky < nby; ++ky) {
      grid[ky] = [];
      for (let kx = 0; kx < nbx; ++kx) {
        grid[ky][kx] = undefined;
      } // for kx
    } // for ky
  } // createGrid

  //----------------------------------------------------------------------------
  function createExplorers() {
    let kx, ky, hue, lum, ntry;
    explorers = [];
    for (let k = 0; k < (nbx * nby) / area; ++k) {
      do {
        kx = intAlea(nbx);
        ky = intAlea(nby);
      } while (
        explorers.some(
          (cell) => mabs(cell.kx - kx) < 5 && mabs(cell.ky - ky) < 5
        )
      );
      explorers[k] = { kx: kx, ky: ky };
      // choose hue / luminosity pair not too close to any other
      ntry = 0;
      do {
        hue = intAlea(360);
        lum = intAlea(20, 60);
        ++ntry;
        if (ntry > 100) break; // don't ask for impossible conditions
      } while (
        explorers.some(
          (cell) =>
            (mabs(cell.hue - hue) < 30 || mabs(cell.hue - hue) > 360 - 30) &&
            mabs(cell.lum - lum) < 10
        )
      );
      explorers[k].hue = hue;
      explorers[k].lum = lum;
      grid[ky][kx] = k;
    } // for k
  } // createExplorers

  //-----------------------------------------------------------------------------
  // returns false if nothing can be done, true if drawing done

  function startOver() {
    let hue, offs;

    // canvas dimensions

    maxx = window.innerWidth;
    maxy = window.innerHeight;

    canv.style.left = (window.innerWidth - maxx) / 2 + "px";
    canv.style.top = (window.innerHeight - maxy) / 2 + "px";

    ctx.canvas.width = maxx;
    ctx.canvas.height = maxy;
    ctx.imageSmoothingEnabled = false;

    nbx = mceil(maxx / step);
    nby = mceil(maxy / step);

    if (nbx < 10 || nby < 10) return false; // not interesting

    // calculate positions of columns / rows
    xDisp = [];
    offs = mfloor((maxx - nbx * step) / 2);
    for (let kx = 0; kx < nbx; ++kx) xDisp[kx] = offs + kx * step;

    yDisp = [];
    offs = mfloor((maxy - nby * step) / 2);
    for (let ky = 0; ky < nby; ++ky) yDisp[ky] = offs + ky * step;

    createGrid();
    createExplorers();

    return true; // ok
  } // startOver

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  function clickCanvas(event) {
    if (event.target.tagName == "CANVAS") {
      animState = 0;
    }
  } //  clickCanvas

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  function resize(event) {
    animState = 0;
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  function animate(tStamp) {
    let dir, nx, ny;
    let possib, unknown;

    switch (animState) {
      case 0:
        if (startOver()) ++animState;
        break;
      case 1:
        explorers.forEach((expl, k) => {
          do {
            possib = []; // list of all possible neighbours
            unknown = [];
            for (dir = 0; dir < 4; ++dir) {
              nx = expl.kx + [0, 1, 0, -1][dir];
              if (nx < 0 || nx >= nbx) continue;
              ny = expl.ky + [-1, 0, 1, 0][dir];
              if (ny < 0 || ny >= nby) continue;
              if (grid[ny][nx] === undefined) unknown.push([nx, ny]);
              else if (grid[ny][nx] === k) possib.push([nx, ny]);
            } // for dir
            // prefer unknown cells, else cells already owned, else nothing
            if (unknown.length == 0) unknown = possib;
            if (unknown.length == 0) continue; // no 'good' neighbour
            [nx, ny] = randomElement(unknown);
            grid[ny][nx] = k; // new cell for me
            drawCell(expl.kx, expl.ky, false); // out of previous place
            expl.kx = nx;
            expl.ky = ny; // move
            drawCell(expl.kx, expl.ky, true); // at new place
            return;
          } while (true);
        }); // explorers.forEach
    } // switch
    requestAnimationFrame(animate);
  } // animate
  //------------------------------------------------------------------------
  //------------------------------------------------------------------------
  // beginning of execution

  {
    canv = document.createElement("canvas");
    canv.style.position = "absolute";
    document.body.appendChild(canv);
    ctx = canv.getContext("2d");
    canv.setAttribute("title", "click to restart");
  } // canvas creation

  window.addEventListener("click", clickCanvas);
  window.addEventListener("resize", resize);
  animState = 0; // to startOver
  requestAnimationFrame(animate);
}); // window load listener
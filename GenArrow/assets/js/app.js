/**
 * Created by leon on 06/08/15.
 */

( function( $ ) {
  "use strict"

  var App = {
    init: function () {
      this.cacheElements();
      this.bindEvents();
    },
    cacheElements: function () {
      this.$window = $(window);
      this.$data = $("#model-data");
      this.$btnGenerate = $("#btn-generate-strict");
      this.$scale = $("#scale");
      this.$rowScale = $("#row-scale");
      this.$rowHead = $("#row-head");
    },
    bindEvents: function () {
      this.$btnGenerate.on("click", function () {
        if ( !App.$scale.val() ) {
          App.$scale.val(1);
        }
        if ( !App.$rowScale.val() ) {
          App.$rowScale.val(1);
        }
        if ( !App.$rowHead.val() ) {
          App.$rowHead.val(30);
        }
        GenArrow.init({
          originalHeight: 100,
          headSize: App.$rowHead.val() / App.$rowScale.val(),
          scaleData: App.$scale.val(),
          rowScale: App.$rowScale.val(),
          contextWeight: 6,
          arrowWeight: 50
        });
      });
      $("input").on("keyup", function(e){
        console.log(e);
        if (e.keyCode == 13) {
          App.$btnGenerate.trigger("click");
        }
      });
    }
  };

  var GenArrow = {
    init: function ( args ) {
      console.log("gen arrow is initialising");
      GenArrow.originalHeight = args.originalHeight;
      GenArrow.headSize = args.headSize;
      App.scaleData = args.scaleData;
      App.rowScale = args.rowScale;
      App.contextWeight = args.contextWeight;
      App.arrowWeight = args.arrowWeight;
      GenArrow.generateData();
      GenArrow.initCanvas();
      GenArrow.drawContext();
      GenArrow.drawGens();
    },
    generateData: function () {
      console.log("generatong data...")
      var minLenght = null, maxLenght = null, totalLenght = 0;
      var rows = App.$data.val().split("\n");
      App.data = {};
      var start, end, genLenght, strand, color;
      for (var i = 0; i< rows.length; i++) {
        start = +rows[i].split("	")[0],
        end = +rows[i].split("	")[1],
        genLenght = (+rows[i].split("	")[1]) - (+rows[i].split("	")[0]),
        strand = rows[i].split("	")[2] === "+" ? 1 : rows[i].split("	")[2] === "-" ? -1 : 0,
        color = rows[i].split("	")[3] ? "#" + rows[i].split("	")[3] : null;
        var row = {
          id: i,
          start : start,
          end : end,
          genLenght : strand * genLenght,
          strand : strand,
          color: color
        };
        if ( row.genLenght < minLenght || minLenght == null ) {
          minLenght = row.genLenght;
        }
        if ( row.genLenght > maxLenght || maxLenght == null ) {
          maxLenght = row.genLenght;
        }
        totalLenght += +row.genLenght;
        App.data[i]  = row;
      }
      App.extraData = {};
      App.extraData.maxLength = maxLenght;
      App.extraData.minLenght = minLenght;
      App.extraData.totalLenght = totalLenght;
      App.extraData.totalGens = rows.length;
    },
    initCanvas: function () {
      console.log("generating canvas...");
      if (App.extraData.totalLenght / App.scaleData > 32000) {
        App.scaleData = App.scaleData * 2;
        App.$scale.val(App.scaleData);
      }
      $("canvas").attr("width", ( App.extraData.totalLenght / App.scaleData ) )
    },
    drawContext: function () {
      console.log("drawing context...");

      var contextLenght = App.extraData.totalLenght / App.scaleData;
      var canvas = document.querySelector('canvas');
      var context = canvas.getContext('2d');

      context.beginPath();
      context.moveTo(0, +GenArrow.originalHeight);
      context.lineTo(contextLenght, +GenArrow.originalHeight);
      context.lineWidth = (App.contextWeight / App.scaleData);
      context.strokeStyle = '#000';
      context.stroke();
    },
    drawGens: function () {
      console.log("drawing gens...");

      var ctx = document.querySelector('canvas').getContext('2d');

      ctx.lineWidth = App.arrowWeight / App.rowScale;
      ctx.lineCap = 'round';

      for (var j = 0; j < App.extraData.totalGens ; j++) {
        if ( App.data[j].strand == 1 ) {
          if (App.data[j].color) {
            ctx.fillStyle = ctx.strokeStyle = "" + App.data[j].color;
          } else {
            ctx.fillStyle = ctx.strokeStyle = '#099';
          }
          arrow(ctx,{
            x: ( App.data[j].start - App.data[0].start ) / App.scaleData,
            y: GenArrow.originalHeight
          },{
            x: ( ( App.data[j].start - App.data[0].start + App.data[j].genLenght ) / App.scaleData ) - GenArrow.headSize,
            y: GenArrow.originalHeight
          },GenArrow.headSize);
        } else if (App.data[j].strand == -1) {
          ctx.fillStyle = ctx.strokeStyle = '#909';
          arrow(ctx,{
            x: ( ( App.data[j].start - App.data[0].start ) / App.scaleData ),
            y: GenArrow.originalHeight
          },{
            x: ( ( App.data[j].end - App.data[0].start ) / App.scaleData ) + GenArrow.headSize,
            y: GenArrow.originalHeight
          },GenArrow.headSize);
        }
      }
    }
  };
  App.init();

} )( jQuery );

function arrow(ctx,p1,p2,size){

  ctx.save();

  var points = [p1, p2];
  //if (points.length < 2) return
  p1 = points[0], p2=points[points.length-1];

  // Rotate the context to point along the path
  var dx = p2.x-p1.x, dy=p2.y-p1.y, len=Math.sqrt(dx*dx+dy*dy);
  ctx.translate(p2.x,p2.y);
  ctx.rotate(Math.atan2(dy,dx));

  // line
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0,0);
  ctx.lineTo(-len,0);
  ctx.closePath();
  ctx.stroke();

  // arrowhead
  ctx.beginPath();
  ctx.moveTo(-5,0);
  ctx.moveTo(size,0)
  ctx.lineTo(-5,-size*1.5);
  ctx.lineTo(-5, size*1.5);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// Find all transparent/opaque transitions between two points
// Uses http://en.wikipedia.org/wiki/Bresenham's_line_algorithm
function edges(ctx,p1,p2,cutoff){
  if (!cutoff) cutoff = 220; // alpha threshold
  var dx = Math.abs(p2.x - p1.x), dy = Math.abs(p2.y - p1.y),
    sx = p2.x > p1.x ? 1 : -1,  sy = p2.y > p1.y ? 1 : -1;
  var x0 = Math.min(p1.x,p2.x), y0=Math.min(p1.y,p2.y);
  var pixels = ctx.getImageData(x0,y0,dx+1,dy+1).data;
  var hits=[], over=null;
  for (x=p1.x,y=p1.y,e=dx-dy; x!=p2.x||y!=p2.y;){
    var alpha = pixels[((y-y0)*(dx+1)+x-x0)*4 + 3];
    if (over!=null && (over ? alpha<cutoff : alpha>=cutoff)){
      hits.push({x:x,y:y});
    }
    var e2 = 2*e;
    if (e2 > -dy){ e-=dy; x+=sx }
    if (e2 <  dx){ e+=dx; y+=sy  }
    over = alpha>=cutoff;
  }
  return hits;
}

function randomDiamond(ctx,color){
  var x = Math.round(Math.random()*(ctx.canvas.width  - 100) + 50),
    y = Math.round(Math.random()*(ctx.canvas.height - 100) + 50);
  ctx.save();
  ctx.fillStyle = color;
  ctx.translate(x,y);
  ctx.rotate(Math.random() * Math.PI);
  var scale = Math.random()*0.8 + 0.4;
  ctx.scale(scale,scale);
  ctx.lineWidth = 5/scale;
  ctx.fillRect(-50,-50,100,100);
  ctx.strokeRect(-50,-50,100,100);
  ctx.restore();
  return {x:x,y:y};
}

function randomCircle(ctx,color){
  ctx.save();
  ctx.beginPath();
  ctx.arc(
    Math.round(Math.random()*(ctx.canvas.width  - 100) + 50),
    Math.round(Math.random()*(ctx.canvas.height - 100) + 50),
    Math.random()*20 + 10,
    0, Math.PI * 2, false
  );
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

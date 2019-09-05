/**
 * Created by leon on 30/08/15.
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
      this.$btnGenerate = $("#btn-generate");
      this.$scale = $("#scale");
      this.$rowScale = $("#row-scale");
      this.$rowHead = $("#row-head");
      this.$minorW = $("#minor-weight");
      this.$mainW = $("#main-weight");
      this.$contextRate = $("#context-rate");
      this.$contextLenght = $("#context-lenght");
      this.$contextHeight = $("#context-height");
      this.$headWeight = $("#head-weight")
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
          headWeight: App.$headWeight.val() / App.$rowScale.val(),
          scaleData: App.$scale.val(),
          rowScale: App.$rowScale.val(),
          contextWeight: 6,
          arrowWeight: 28
        });
      });
      $("input").on("keyup", function(e){
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
      GenArrow.headWeight = args.headWeight;
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
      console.log("generating data...")
      var minLenght = null, maxLenght = null, totalLenght = 0;
      var rows = App.$data.val().split("\n");
      App.data = {};
      var start, end, genLenght, strand, color, name;
      var index = 0;
      for (var i = 0; i< rows.length; i++) {
        start = +rows[i].split("	")[0];
        end = +rows[i].split("	")[1];
        genLenght = (+rows[i].split("	")[1]) - (+rows[i].split("	")[0]);
        strand = rows[i].split("	")[2] === "+" ? 1 : rows[i].split("	")[2] === "-" ? -1 : 0;
        color = rows[i].split("	")[3] ? "#" + rows[i].split("	")[3] : null;
        name = rows[i].split("	")[4] ? ( "" + rows[i].split("	")[4] ) : null;
        var genRow = {
          id: index,
          start : strand === 1 ? start : end,
          end : strand === 1 ? end : start,
          genLenght : strand * genLenght,
          strand : strand,
          color: color,
          name: name,
          type: "gen"
        };
        App.data[index]  = genRow;
        index ++;
        if ( index >= 2 && App.data[index - 2].type === "gen" && App.data[index - 2].end < App.data[index-1].start ) {
          var contextRow = {
            id: index,
            start : App.data[index - 2].end,
            end: App.data[index-1].start,
            genLenght : App.data[index-1].start - App.data[index - 2].end,
            type: "context"
          };
          App.data[ index - 1 ]  = contextRow;
          App.data[index] = genRow;
          index ++;
        } else if ( index >= 3 && App.data[index - 2].type === "context" && App.data[index - 3].end < App.data[index - 1].start) {
          var contextRow = {
            id: index,
            start : App.data[index - 3].end,
            end: App.data[index-1].start,
            genLenght : App.data[index-1].start - App.data[index - 3].end,
            type: "context"
          };
          App.data[ index - 1 ]  = contextRow;
          App.data[index] = genRow;
          index ++;
        }
        if ( genRow.genLenght < minLenght || minLenght == null ) {
          minLenght = genRow.genLenght;
        }
        if ( genRow.genLenght > maxLenght || maxLenght == null ) {
          maxLenght = genRow.genLenght;
        }
        totalLenght += +genRow.genLenght;
      }
      App.extraData = {};
      App.extraData.maxLength = maxLenght;
      App.extraData.minLenght = minLenght;
      App.extraData.totalLenght = totalLenght;
      App.extraData.totalGens = index;
    },
    initCanvas: function () {
      console.log("generating canvas...");
      if (App.extraData.totalLenght / App.scaleData > 32000) {
        App.scaleData = App.scaleData * 2;
        App.$scale.val(App.scaleData);
      }
      $("canvas").attr("width", App.$contextLenght.val())//( App.extraData.totalLenght / App.scaleData ) )
      $("canvas").attr("height", App.$contextHeight.val())//( App.extraData.totalLenght / App.scaleData ) )
    },
    drawContext: function () {
      console.log("drawing context...");

      var contextLenght = App.extraData.totalLenght / App.scaleData;
      var canvas = document.querySelector('canvas');
      var context = canvas.getContext('2d');

      context.beginPath();
      context.moveTo(0, +GenArrow.originalHeight);
      context.lineTo(contextLenght, +GenArrow.originalHeight);
      context.lineWidth = 6;//(App.contextWeight / App.scaleData);TODO aplicar el contexto
      context.strokeStyle = '#000';
      context.stroke();
    },
    drawGens: function () {
      console.log("drawing gens...");

      var ctx = document.querySelector('canvas').getContext('2d');

      ctx.lineCap = 'round';

      var actualContext = 0;

      for (var j = 0; j < App.extraData.totalGens ; j++) {

        var actualRow = GenArrow.formatData( App.data[j] );

        if ( actualRow.strand == 1 ) {
          if (actualRow.color) {
            ctx.fillStyle = ctx.strokeStyle = "" + actualRow.color;
          } else {
            ctx.fillStyle = ctx.strokeStyle = '#099';
          }
          GenArrow.drawArrow(ctx,{
            x: ( actualContext ) / App.scaleData,
            y: GenArrow.originalHeight
          },{
            x: ( ( actualContext + actualRow.genLenght ) / App.scaleData ) - GenArrow.headSize,
            y: GenArrow.originalHeight
          },GenArrow.headSize, GenArrow.headWeight);
          GenArrow.drawGenName({
            ctx: ctx,
            x: ( ( ( ( (2 * actualContext ) + actualRow.genLenght + GenArrow.headSize ) / App.scaleData ) - GenArrow.headSize) )/2,
            y: GenArrow.originalHeight + 50,
            name: actualRow.name
          });
        } else if (actualRow.strand == -1) {
          if (actualRow.color) {
            ctx.fillStyle = ctx.strokeStyle = "" + actualRow.color;
          } else {
            ctx.fillStyle = ctx.strokeStyle = '#909';
          }
          GenArrow.drawArrow(ctx,{
            x: ( ( actualContext + actualRow.genLenght ) / App.scaleData ),
            y: GenArrow.originalHeight
          },{
            x: ( ( actualContext ) / App.scaleData ) + GenArrow.headSize,
            y: GenArrow.originalHeight
          }, GenArrow.headSize, GenArrow.headWeight);
          GenArrow.drawGenName({
            ctx: ctx,
            x: ( ( ( ( (2 * actualContext ) + actualRow.genLenght + GenArrow.headSize ) / App.scaleData ) - GenArrow.headSize) )/2,
            y: GenArrow.originalHeight + 50,
            name: actualRow.name
          });
        } else if (actualRow.type === "context") {
          ctx.fillStyle = ctx.strokeStyle = '#000';
          GenArrow.drawContextLine(ctx,{
            x: ( ( actualContext ) / App.scaleData ),
            y: GenArrow.originalHeight
          },{
            x: ( ( actualContext + actualRow.genLenght ) / App.scaleData ),
            y: GenArrow.originalHeight
          },GenArrow.headSize);
        }
        actualContext += actualRow.genLenght;
      }
    },
    formatData: function (row) {
      if (row.type === "context") {
        return {
          id: row.id,
          start : row.start,
          end : row.end,
          genLenght : ( row.genLenght / +App.$contextRate.val() ),
          strand : row.strand,
          color: row.color,
          type: row.type
        }
      }
      var mod1 = ( App.$mainW.val() - App.$minorW.val() );
      var mod2 = ( App.extraData.maxLength - App.extraData.minLenght );
      var prop1 = ( row.genLenght - App.extraData.minLenght );
      var finalLenght = ( +App.$minorW.val() + ( (prop1 /  mod2 ) * mod1 ) );

      return {
        id: row.id,
        start : row.start,
        end : row.end,
        genLenght : finalLenght,
        strand : row.strand,
        color: row.color,
        name: row.name,
        type: row.type
      }
    },
    drawArrow: function (ctx, p1, p2, headSize, headWeight){

      ctx.lineWidth = App.arrowWeight / App.rowScale;

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
      ctx.moveTo(-1,0);
      ctx.moveTo(headSize,0);
      ctx.lineTo(-1,-headWeight);
      ctx.lineTo(-1, headWeight);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    },
    drawContextLine: function (ctx,p1,p2,size) {
      ctx.save();

      ctx.lineWidth = 6;

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

      ctx.restore();
    },
    drawGenName: function (dto) {

      console.log("drawing name");
      var context = dto.ctx;
      context.fillStyle = "black";
      context.font = "bold 12px Arial";
      context.textAlign = 'center';
      context.fillText(dto.name, dto.x, dto.y);

      context.restore();
    }
  };
  App.init();

} )( jQuery );

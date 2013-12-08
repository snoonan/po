var game_cfg = {
   "start_cash": [-1,0,0,40,30,24],
   "companies": [
      ["Preußische Ostbahn","PO",[21,0], 20, 'black'],
      ["Niederschlesisch-Märkische Eisenbahn","NME", [21,10], 17, 'brown'],
      ["Königlich-Sächsische Staatseisenbahnen","KSS",[14,10], 16, 'orange'],
      ["Königlich-Bayerische Staatseisenbahnen","KBS",[17,18], 15, 'blue'],
      ["Main-Weser-Bahn","MWB",[10,10], 14, 'yellow'],
      ["Großherzoglich Badische Staatseisenbahnen","GBS",[11,15], 13, 'red'],
      ["Cöln-Mindener Eisenbahn-Gesellschaft","CMEG",[6,9], 12, 'purple'],
      ["Berlin-Hamburger Eisenbahn-Gesellschaft","BHEG",[9,4], 11, 'green']
   ],
   "map": [
",        p1p                   p p p     p3",
"        p p p1    p p1      p p1p p p1p p ",
",        p p p1p p1p p p p p p p p p p p ",
"    p   p p3p p p p p1p p1p p p p p p p ",
",  p p1p1p p p1p p p p p p p p p1p1p ",
"    p p p p p p p pbpbpbp p p1p p p ",
",  p p1p p p p p pbpBpBpbp p p p p ",
"  p p h1h p1p1p p1pbpBpbp1p p p1p ",
",p1p1p1h h h p p p pbpbp1p p p p ",
"p1p1p1h h h1m m p1p p p p p p1p p ",
",p1h h m m1m1m1h p1h h2h h1h p p2p ",
"p1p2p m m m m h h h h1m m m m p1p ",
",h h1m h h h m h h1m ",
"h m h1h2m h1h h1m m ",
",m h h m h m m h m ",
"m1m h h1h m m h1m m ",
",m h h1m1m m h m h1m ",
"  h1h m m1m m h m h m ",
",  m1m m m m m1m3m m "
]
};

var game = {
};

function update_money(c, v) {
   game.companies[c].money += +v;
   $('#'+c+'_money').text(game.companies[c].money);
}
function add_income(c, v) {
   game.companies[c].income += +v;
   $('#'+c+'_income').text(game.companies[c].income);
   game.companies[c].holders.forEach(function (h) {
      game.players[h].income += +v;
      $('#'+b+'_income').text(game.players[h].income);
   });
}
function place_cube(c,x,y) {
  if (!game.loc[x+'_'+y]) { game.loc[x+'_'+y] = []; }
  game.loc[x+'_'+y].push(c);
  $('#'+x+'_'+y+" .middle").append($('<span/>', {"style":"background:"+game.companies[c].color, html:"&nbsp;"}));
  game.companies[c].cubes -= 1;
  $('#'+c+'_cubes').text(game.companies[c].cubes);
}

function touch(a,b) {
  $('#'+a+'_touch').append($('<span/>', {"style":"background:"+game.companies[b].color, html:"&nbsp;"}));
  game.companies[a].touched[b] = true;
}
function offer_stock(c) {
   var name = this.id.split('_')[0]
   name = game.companies[name].fullname;
   alert('offering '+name);

   if (game.placing_co == undefined) {
      return;
   }
}
function place_cubes(c) {
   var name = this.id.split('_')[0]
   var fullname = game.companies[name].fullname;
   game.merged = false;
   game.placing_co = name;
   game.placing_cubes = 3;
   game.placing_cost = 0;
   // SPECIAL: PO gets 4 cube placement.
   if (name == "PO") { game.placing_cubes=4;}
   // SPECIAL: KSS gets 2 cube placement.
   if (name == "KSS") { game.placing_cubes=2;}
   game.placing_free = false;
   // SPECIAL: GBS gets a free non-city placement.
   if (name == 'GBS') { game.placing_free = true; }
   // Limit to cubes on hand.
   game.placing_cubes = Math.min(game.companies[name].cubes, game.placing_cubes);
   alert('placing '+game.placing_cubes+" for "+fullname);
}
function clickhex(h) {
   var loc;
   var e;

   if (game.placing_co == undefined) {
      return;
   }
   e = $(h.srcElement);
   while (!e.hasClass('middle') && !e.hasClass('hex')) {
      e = e.parent();
   }
   if (!e.hasClass('middle')) {
      return;
   }
   if (e.attr('land') == ' ') {
      return;
   }
   loc = e.parent().attr('id').split('_');
   var ok = false;
   var x = +loc[0];
   var y = +loc[1];
   if (game.loc[x+'_'+y] != undefined && e.attr('city') == ' ') {
      // Only cities can have more than one cube.
      return;
   }
   [[x-1,y-1],
    [x-1,y],
    [x,y-1],
    [x,y+1],
    [x+1,y],
    [x+1,y+1]].forEach(function(l) {
       var x = l[0];
       var y = l[1];
       if (game.loc[x+'_'+y] &&  game.loc[x+'_'+y].indexOf(game.placing_co) != -1) {
          ok = true;
       }
    });
    if (!ok) {
       return;
    }
    var cost;
    cost = {'p':2, 'h':3, 'm':4}[e.attr('land')];
    // Only cities can have more than one cube.
    // SPECIAL: NME has free city entry.
    if (game.loc[x+'_'+y] && game.placing_co != 'NME') {
      cost += game.loc[x+'_'+y].length;
    } else {
       if (game.placing_free) {
          cost = 0;
          game.placing_free = false;
       }
    }

    // SPECIAL: KBS has cheaper costs.
    if (game.placing_co == 'KBS') {
       cost -= 1;
    }
    if (game.companies[game.placing_co].cash >= cost &&
       // SPECIAL CMEG can only spend 5.
        (game.place_cost+cost < 5 || game.placing_co != 'CMEG'))
    {
       return;
    }

    place_cube(game.placing_co, x, y);
    var city = e.attr('city');
    if (city != ' ') {
       if (game.city[x+'_'+y]) {
          game.city[x+'_'+y].forEach(function (c)  {
             if(!game.companies[game.placing_co].touched[c]) {
                game.merge = true;
             }
             touch(c, game.placing_co);
             touch(game.placing_co, c);
          });
       } else {
          game.city[x+'_'+y] = [];
       }
       game.city[x+'_'+y].push(game.placing_co);
       add_income(game.placing_co, city);
    }
    update_money(game.placing_co, -cost);
    game.placing_cubes -= 1;
}

function start()
{
   var map = $('#map');
   var table;
   var x,y;
   var start_col;

   x = 0; y = 0;
   start_col = 0;
   game_cfg.map.forEach(function (l) {
      var col = $("<div>", { "class":"hex-row"});
      map.append(col);
      if (l.charAt(0) == ",") {
         l = l.slice(1);
         col.addClass("even");
         start_col += 1;
      }
      x = start_col;
      var out = l.match(/.{1,2}/g);
      out.forEach(function(c) {
         var wrapper = $("<div>",{id:x+"_"+y, "class":"hex"});
         var cell = $("<div>",{"class":"top", land:c.charAt(0), city:c.charAt(1)});
         wrapper.append(cell);
         cell = $("<div>",{"class":"middle", land:c.charAt(0), city:c.charAt(1)});
         if (c.charAt(1) != " ") {
            cell.append($("<span/>", { text:c.charAt(1)/*, style:"position:relative; z-index:2"*/}));
         }
         wrapper.append(cell);
         cell = $("<div>",{"class":"bottom", land:c.charAt(0), city:c.charAt(1)});
         wrapper.append(cell);
         col.append(wrapper);
         x += 1;
      });
      y += 1;
   });
   $('#map').click(clickhex)

   table = $('#companies');
   game.companies = {};
   game.auction_list = [];
   game.loc = [];
   game.city = {}
   game_cfg.companies.forEach(function (l) {
      var fullname = l[0];
      var name = l[1];
      var loc = l[2];
      var cubes = l[3];
      var color = l[4];

      var row;
      var cell;

      var company = {'name':name,
                     'fullname':fullname,
                     'money': 50,
                     'cubes': cubes,
                     'income':0,
                     'stock':3,
                     'holders':[],
                     'color':color,
                     'touched':{},
                     };
      game.companies[name] = company;
      // Auction one each in this order at start of game.
      game.auction_list.push(name);

      row = $("<tr>");
      cell = $("<td/>", {text:name, style:'background:'+color+';'});
      row.append(cell);
      cell = $("<td/>", {id:name+'_stock', 'class':'auction', text:company.stock});
      row.append(cell);
      cell = $("<td/>", {id:name+'_income', text:company.income});
      row.append(cell);
      cell = $("<td/>", {id:name+'_money', text:company.money});
      row.append(cell);
      cell = $("<td/>", {id:name+'_touch'});
      row.append(cell);
      cell = $("<td/>", {id:name+'_cubes', 'class':'place', text:company.cubes});
      row.append(cell);

      table.append(row);
      // Place starting city.
      place_cube(name, loc[0], loc[1]);
      game.city[loc[0]+'_'+loc[1]] = [name];
      add_income(name, $('#'+loc[0]+'_'+loc[1]+' .middle').attr('city'));
   });
   $('.auction').click(offer_stock);
   $('.place').click(place_cubes);
}


window.onload = function(e) {
   start()
};

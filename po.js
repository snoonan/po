var game_cfg = {
   "start_money": [-1,0,0,40,30,24],
   "companies": [
      ["Preußische Ostbahn","PO",[21,0], 20, 'black',""],
      ["Niederschlesisch-Märkische Eisenbahn","NME", [21,10], 17, 'brown',""],
      ["Königlich-Sächsische Staatseisenbahnen","KSS",[14,10], 16, 'orange',""],
      ["Königlich-Bayerische Staatseisenbahnen","KBS",[17,18], 15, 'blue',""],
      ["Main-Weser-Bahn","MWB",[10,10], 14, 'yellow',""],
      ["Großherzoglich Badische Staatseisenbahnen","GBS",[11,15], 13, 'red',""],
      ["Cöln-Mindener Eisenbahn-Gesellschaft","CMEG",[6,9], 12, 'purple',""],
      ["Berlin-Hamburger Eisenbahn-Gesellschaft","BHEG",[9,4], 11, 'green',""]
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

function bid_pass() {
   game.bidders -= 1;
   game.players[game.player_list[game.auction_idx]].pass = true;
   next_auction();
}
function bid() {
   var v = +$('#bid').val();
   if (v <= game.auction_value) {
      return;
   }
   if (v > game.game.auction_value.money) {
      return;
   }
   game.auction_value = v;
   game.auction_winner = game.auction_p;
   $('#h_bidder').text(game.players[game.auction_p].name);
   $('#h_bid').text(v);
   next_auction();
}

function next_auction() {
   if (game.bidders == 0) {
      // Unwanted, return to pool.
      next_action();
   }
   game.auction_idx += 1;
   if (game.auction_idx == game.max_player) {game.auction_idx = 0;}
   if ( game.players[game.player_list[game.auction_idx]].pass) {
      next_auction();
      return;
   }
   game.auction_p = game.player_list[game.auction_idx];
   if (game.bidders == 1 && game.auction_value > 0) {
      // Winner
      buy_stock(game.bid_share,game.auction_p,game.auction_value);
      game.bid_share = undefined;
      $('#auction').hide();
      $('#turn').show();
      if (game.starting < game_cfg.companies.length) {
         game.player_id = game.auction_winner;
         _offer_stock(game_cfg.companies[game.starting][1]);
         game.starting += 1;
         return;
      } else if (game.starting == game_cfg.companies.length) {
         next_turn();
         return;
      }
      next_action();
   }
   $('#bidder').text(game.players[game.auction_p].name);
   $('#bid').val(game.auction_value + 1);
}
function offer_stock(c) {
   if (game.bid_share || game.place_co) {
      // Already doing some action
      return;
   }
   var name = this.id.split('_')[0]
   _offer_stock(name);
}
function _offer_stock(name) {
   game.bid_share = name;
   game.auction_value = -1;
   game.auction_winner = undefined;
   $('#bid_co').text(game.companies[name].fullname);
   $('#bid_mark').attr('style',game.companies[name].color);
   $('#bid').val(0);
   $('#auction').show();
   $('#turn').hide();
   for (var i = 0; i < game.max_player; i += 1) {
      game.players[game.player_list[i]].pass = false;
   }
   // -1 is because next will ++ before doing anything and THIS is the first player to bid.
   game.bidders = game.max_player;
   game.auction_idx = game.player_list.indexOf(game.player_id) - 1;
   next_auction();
}
function buy_stock(c,p,m) {
   game.companies[c].stock -=1;
   $('#'+c+'_stock').text(game.companies[c].stock);
   game.companies[c].holders.push(p);
   update_c_money(c,m);
   update_p_money(p,-m);
   game.players[p].shares.push(c);
   game.players[p].income += game.companies[c].income;
   $('#p'+p+'_income').text(game.players[p].income);
   $('#p'+p+'_shares').append($('<span/>', {"style":"background:"+game.companies[c].color, html:c}));
}

function next_turn() {
   var list = [];
   game.players.forEach(function(p) {
      if (p.id == undefined) {return;}
      if (list[p.income] == undefined) { list[p.income] = []; }
      list[p.income].push(p.id);
   });
   var cup = [];
   var count = 1;
   list.reverse().forEach(function (r) {
      r.forEach(function(p) {
         for (var c = 0; c < count; c++) {
            cup.push(p);
         }
      });
      count += 1;
   });
   game.actions = [];
   for(var c = 0; c < game.max_player; c++) {
       var p = cup.splice(Math.random() * cup.length, 1)[0];
       game.actions.push(p);
       $('#actions').append($('<span/>', {"p":p, text:game.players[p].name}));
   }
   next_action();
}
function end_action() {
   if (game.merge) {
      // A merge event happened, pay out.
      // Pay everyone.
      $.each(game.companies, function(c) {
         game.companies[c].holders.forEach(function (h) {
            // SPECIAL: BHEG needs to be at[8,2] and game.berlin to pay
            if (c == 'BHEG' && (game.companies[c].city.indexOf('8_2') == -1 ||
                                game.companies[c].city.indexOf(game.berlin[0]+'_'+game.berlin[1]) == -1)) {
               return;
            }
            update_p_money(h, +game.companies[c].income);
         });
      });
      // Pay touching co again.
      game.companies[game.placing_co].holders.forEach(function (h) {
         // SPECIAL: BHEG needs to be at[8,2] and game.berlin to pay
         if (game.placing_co == 'BHEG' &&
              (game.companies[game.placing_co].city.indexOf('8_2') == -1 ||
               game.companies[game.placing_co].city.indexOf(game.berlin[0]+'_'+game.berlin[1]) == -1)) {
            return;
         }
         update_p_money(h, +game.companies[game.placing_co].income);
      });
   }
   next_action();
}
function next_action() {
   game.placing_co = undefined;
   if (game.actions.length == 0) {
      next_turn();
      return;
   }
   game.player_id = game.actions.shift();
   // Highlight/restrict choice by held stock.
   $('.place.valid').removeClass('valid');
   game.players[game.player_id].shares.forEach(function (c) {
      $('#'+c+'_cubes').addClass('valid');
   });

   $('#action').children().remove();
   $('#action').append($('#actions').children()[0]);
}
function update_p_money(p, v) {
   game.players[p].money += +v;
   $('#p'+p+'_money').text(game.players[p].money);
}
function update_c_money(c, v) {
   game.companies[c].money += +v;
   $('#'+c+'_money').text(game.companies[c].money);
}
function add_income(c, v) {
   // SPECIAL: MWB doubles biggest city.
   if (c == "MWB") {
      if (v > (game.companies[c].biggest_city||0)) {
         // Add new biggest.
         v += v;
         // Subtract last biggest.
         v -= game.companies[c].biggest_city||0;
         game.companies[c].biggest_city = v;
      }
   }
   game.companies[c].income += +v;
   $('#'+c+'_income').text(game.companies[c].income);
   game.companies[c].holders.forEach(function (h) {
      game.players[h].income += +v;
      $('#p'+h+'_income').text(game.players[h].income);
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
function place_cubes(c) {
   if (game.bid_share || game.place_co) {
      // Already doing some action
      return;
   }
   var name = this.id.split('_')[0]
   if (game.companies[name].holders.indexOf(game.player_id) == -1) {
      return;
   }
   var fullname = game.companies[name].fullname;
   game.merge = false;
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
    var city = e.attr('city');
    if (city == 'B') {
       x = game.berlin[0];
       y = game.berlin[1];
       city = 3;
    }
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

    if (cost > game.companies[game.placing_co].money) {
       return;
    }
    if (city == 'b') {
       if (game.companies[game.placing_co].bez == true) {
          return;
       } else {
          game.companies[game.placing_co].bez = true;
       }
    }
    else if (city != ' ') {
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
       add_income(game.placing_co, +city);
    }
    place_cube(game.placing_co, x, y);
    update_c_money(game.placing_co, -cost);
    game.placing_cubes -= 1;
    if (game.placing_cubes == 0) {
       // Last cube
       end_action();
    }
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
         // Berlin is special, but value 3.
         if (c.charAt(1) == 'B') {c="p3"; game.berlin=[x,y];}
         // Berlin exclusion is special, but not a city
         if (c.charAt(1) == 'b') {c="p ";}
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

    var tbl = document.getElementById('players');
    var rows = tbl.getElementsByTagName('tr');
    var r;
    game.players = [];
    game.player_list = [];
    game.max_player = 0;
    for(var i=0; i < 5; i++) {
        game.players[i] = {};
        var ap = document.getElementById("p"+i+"_name");
        if (ap.value == '') {
            var ap = document.getElementById("p"+i);
            ap.hidden = true;
            game.players[i].shares = [];
            game.players[i].income = 0;
        } else {
            game.players[i].id = i;
            game.players[i].name=ap.value;
            game.players[i].shares=[];
            game.players[i].income=0;
            game.players[i].money=0;
            game.player_list.push(i);
            game.max_player++;
        }
    }
   game.player_list.forEach(function (p) {
      update_p_money(p, game_cfg.start_money[game.max_player]);
   });

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
      var special = l[5];

      var row;
      var cell;

      var company = {'name':name,
                     'fullname':fullname,
                     'money': 0,
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
      cell = $("<td/>", {text:name, style:'background:'+color+';', 'title':special});
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
      add_income(name, +$('#'+loc[0]+'_'+loc[1]+' .middle').attr('city'));
   });
   $('.auction').click(offer_stock);
   $('.place').click(place_cubes);

   game.starting = 0;
   game.player_id = 0;
   _offer_stock(game_cfg.companies[game.starting][1]);
   game.starting += 1;
}

function update_name(p)
{
   var ap = document.getElementById("p"+p+"_name");
}


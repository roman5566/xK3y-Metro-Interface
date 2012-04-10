//Global variables needed
var firstLoad=true;
var colors = ['blue','red','green','mango','pink','brown','lime','teal','purple','magenta'];
var dropDownFlag, animCounter, data, saveData;
var listsMade=false;
var wallMade=false;
var foldersMade=false;
var t=true;
//All the pages with linked functions
var pages = {
	'coverwall-page' 		: function(){makeCoverWallPage()},
	'list-page' 			: function(args){makeListPage(args)},
	'folderstructure-page'	: function(args){makeFolderStructurePage(args)},
	'favorites-page' 		: function(){makeFavoritesPage()},
	'search-page' 			: function(){makeSearchPage()},
	'about-page' 			: function(){makeAboutPage()},
	'overlay' 				: function(args){makeOverlay(args)},
	'details-page' 			: function(args){prepDetails(args)},
	'main-screen'			: function(){},
	'config-page'			: function(){}
};
//Default settings
var defaultSettings = {
	'accent' : 'blue',
	'metro' : true
}

$(document).ready(function() {
	getData();
	/*if (document.documentElement.clientWidth>480) {
		viewport = document.querySelector("meta[name=viewport]"); 
		viewport.setAttribute('content', '');
	}

	if (document.documentElement.clientWidth==480) {
		viewport = $('meta[name=viewport]');
		viewport.attr('content', 'width = 320');
	}*/
});

$(window).hashchange(function() {
	getCurrentPage()
});

function getCurrentPage() {
	var hash = window.location.hash;
	showPage(hash);
}

function showPage(page) {
	//Always stop tile animation on page change
	Tile.stop();
	var allPages=[];
	var args;
	if (!page) {
		page='main-screen';
	}
	//Parse arguments
	if (page.indexOf('?')!=-1) {
		args=page.split('?',2);
		page=args[0];
	}
	if (page=='overlay' && firstLoad) {
		history.back();
	}
	if (page.indexOf('#')==0) {
		page = page.slice(1,page.length);
	}
	if (page.indexOf('%')==-1) {
		page=escape(page);
	}
	$('.page').each(function() {
		allPages.push(this.id);
	});
	//Hide all pages
	for (var i=0;i<allPages.length;i++) {
		if ($(document.getElementById(allPages[i])).hasClass('active')) {
			$(document.getElementById(allPages[i])).removeClass('active');
		}
	}
	//Show requested page
	if (!$(document.getElementById(page)).hasClass('active')) {
		$(document.getElementById(page)).addClass('active');
	}
	/*if (args!=null) {
		pages[page](args);
		return;
	}*/
	//Call function related to page
	//if (page.indexOf('-dir')==-1) {
		pages[page](args);
	//}
	//Trigger tile animation for the page, function determines if there will be animation
	Tile.init(page);
	return;
}

function openLetterOverlay() {
	var letters = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"];
	var avail = [];
	$('div[id^="list-divider-"]').each(function() {
		avail.push(this.id.slice(13,14));
	});
	avail.toString();
	var HTML='';
	var cur=0;
	for (var i=0;i<letters.length;i++) {
		if (avail.indexOf(letters[i])==-1) {
			HTML+='<div class="overlay-item overlay-grey">'+letters[i]+'</div>'
		}
		else {
			HTML+='<a href="javascript:location.replace(\'#list-page?'+letters[i]+'\');"><div class="overlay-item '+saveData.Settings.accent+'">'+letters[i]+'</div></a>'
		}
		cur++;
		if(cur == 4) {
			HTML+='<br/>';
			cur=0;
		}
	}
	document.getElementById('overlay').innerHTML=HTML;
	document.getElementById('overlay').style.height="100%";
	firstLoad=false;
}

function accentPopup() {
	var HTML='<div class="accent-item"><br/><span class="title">ACCENTS</span></div>';
	var current=saveData['Settings'].accent;
	for (var i=0; i<colors.length; i++) {
		if (colors[i]==current) {
			HTML+='<a href="javascript:history.back()" onclick="accentChange(\''+colors[i]+'\')"><div class="accent-item"><div class="accent-item-icon '+colors[i]+'"></div><span class="accent-item-text '+colors[i]+'-text">'+colors[i]+'</span></div></a>';
		}
		else {
			HTML+='<a href="javascript:history.back()" onclick="accentChange(\''+colors[i]+'\')"><div class="accent-item"><div class="accent-item-icon '+colors[i]+'"></div><span class="accent-item-text">'+colors[i]+'</span></div></a>';
		}
	}
	document.getElementById('overlay').innerHTML=HTML;
	document.getElementById('overlay').style.height="";
	firstLoad=false;
}

function accentChange(color) {
	var cur=saveData['Settings'].accent;
	//Tiles & other solid stuff
	$('.accent').removeClass(cur).addClass(color);
	//Highlights
	$('.accent-text').removeClass(cur+'-text').addClass(color+'-text');
	//List dividers have a border
	$('.accent-border').removeClass(cur+'-border').addClass(color+'-border');
	//Config button show correct color name
	$('#accentSelect span').html(color);
	saveData['Settings'].accent=color;
	Settings.save();
}

function backgroundDropdown() {
	if (!dropDownFlag) {
		var dropDown = $('#backgroundSelect');
		var current = dropDown.children('.dropdown-active');
		current.children('span').attr('onclick', 'setBackground(this.innerHTML)');
		current.removeClass('dropdown-active');
		dropDown.children('.dropdown-item').slideDown();
		dropDown.attr('onclick','');
		dropDownFlag=true;
	}
}

function setBackground(color) {
	if (dropDownFlag) {
		var dropDown = $('#backgroundSelect');
		$('#'+color).addClass('dropdown-active').attr('onclick','');
		dropDown.children('.dropdown-item:not(.dropdown-active)').slideUp();
		dropDown.attr('onclick','backgroundDropdown()');
		//FF bug, delay being able to open the dropdown by 1 millisecond
		setTimeout('dropDownFlag=false',1);
	}
}

var MessageBox = {
	'Show': function (title, text, buttonHTML) {
		//WP7 already has the smexy alert box, use native
		if (navigator.userAgent.search('Windows Phone') != -1) {
			alert(text);
		}
		else {
			var HTML = '<span class="messagebox-title">'+title+'</span>';
			HTML +=	'<span class="messagebox-text">'+text+'</span>';
			if (buttonHTML==null) {
				HTML += '<a class="button" href="javascript:MessageBox.Close();" style="float:left">ok</a>';
			}
			else {
				HTML += buttonHTML+'<a class="button" href="javascript:MessageBox.Close();" style="float:right">Cancel</a>';
			}
			$('#MessageBox').html(HTML);
			$('#MessageBox').addClass('active');
			scrollUp();
		}
	}, 
	'Close': function () {
		$('#MessageBox').removeClass('active');
	}
}

var Settings = {
	'init': function () {
		var settings = saveData['Settings'];
		var accent;
		if ($.isEmptyObject(settings)) {
			Settings.firstRun();
			return;
		}
		else if (!settings.metro) {
			Settings.firstMetroRun();
			return;
		}
		else {
			//All future settings should be loaded here
			accent=settings.accent;
		}
		//All required functions called with settings
		accentChange(accent);
	},
	
	'save': function () {
		$.post('store.sh', JSON.stringify(saveData));
	},
	
	'firstRun': function () {
		//First run settings
		var settings = defaultSettings;
		saveData['Settings']=settings;
		Settings.save();
		Settings.init();
	},
	'firstMetroRun': function () {
		//First Metro run, preserve already saved settings
		saveData['Settings'] = $.extend(saveData['Settings'],defaultSettings);
		Settings.save();
		Settings.init();
	}
}

function search(input) {
	if (input.length==0) {
		document.getElementById('searchResults').innerHTML="";
		return;
	}
	else {
		var l = data.ISOlist.length;
		var allGames = data.ISOlist;
		var pattern=new RegExp(input,"i");
		var results=[];
		for (var i=0; i<l; i++) {
			//RegExp the input and push results to array
			if (pattern.test(allGames[i].name)) {
				results.push(allGames[i]);
			}
		}
		var l = results.length;
		var HTML='';
		var name, id, cover;
		//Loop through the results and make the HTML
		for (var i=0; i<l; i++) {
			name=results[i].name;
			id=results[i].id;
			cover='covers/'+id+'.jpg';
			HTML+='<a href="#details-page?'+id+'&'+escape(name)+'"><div class="list-item" id="'+id+'"><div class="list-item-icon accent" style="background-image:url(\''+cover+'\'); background-size: 72px;"></div><span class="list-item-text">'+name+'</span></div></a>';
		}
		document.getElementById('searchResults').innerHTML=HTML;
	}
}

function pinToMain(id, name) {
	var HTML='';
	//Build the tile
	HTML+='<a href="#details-page?'+id+'&'+escape(name)+'">';
	HTML+='<div class="tile accent animate" style="background-image:url(\'covers/'+id+'.jpg\'); background-size: 173px;">';
	HTML+='<span class="tile-title">'+name+'</span>';
	HTML+='</div></a>';
	//Append to main menu
	document.getElementById('main-screen').innerHTML+=HTML;
}

var Fav = {
	'createList': function (listName, id, name) {
		var favLists = Fav.lists();
		if ($.isEmptyObject(favLists)) {
			favLists={};
		}
		else if (listName in favLists) {
				MessageBox.Show('List "'+unescape(listName)+'" already exists!');
				return;
		}
		favLists[listName]=[];
		Fav.save(favLists, false);
		Fav.addToList(listName, id, name);
	},
	'removeList': function (listName) {
		var favLists = Fav.lists();
		delete favLists[listName];
		Fav.save(favLists, true);
	},
	'addToList': function (listName, id, name) {
		var favLists = Fav.lists();
		var gameList = favLists[listName];
		gameList.push({
			"id" : id,
			"name" : name });
		Fav.save(favLists, true);
	},
	'removeFromList': function (listName, id) {
		var favLists = Fav.lists();
		var gameList = favLists[listName];
		var index = Fav.findIndex(gameList, id);
		gameList.splice(index,1);
		if (gameList.length==0) {
			removeList(listName);
		}
		Fav.save(favLists, true);
	},
	'findList': function (id) {
		var savedFavLists = Fav.lists();
		var foundLists = [];
		for (var i in savedFavLists) {
			if (JSON.stringify(savedFavLists[i]).indexOf(id)!=-1) foundLists.push(i);
		}
		return foundLists;
	},
	'findIndex': function (array, id) {
		for (var i=0; i<array.length; i++) {
			if (array[i]==id) return i;
		}
		return -1;
	},
	'lists': function () {
		return saveData['FavLists'];
	},
	'save': function (favLists, toServer) {
		saveData['FavLists'] = favLists;
		if (toServer) {
			Settings.save();
		}
	}
}

var Tile = {
	'animateHalf': function (tile) {
		$(tile).animate({backgroundPosition: '0 86px'});
		$(tile).children('span').animate({bottom: '92px'});
		//setTimeout(Tile.animateDown, 2500);
	},
	'animateDown': function (tile) {
		$(tile).animate({backgroundPosition: '0 173px'});
		$(tile).children('span').animate({bottom: '6px'});
		//setTimeout(Tile.animateUp, 2500);
	},
	'animateUp': function (tile) {
		$(tile).animate({backgroundPosition: '0 0'});
		$(tile).children('span').animate({bottom: '179px'});
		//setTimeout(Tile.animateHalf, 2500);
	},
	'animateNext': function(tile,index) {
		var doAnim;
		var random=Math.floor(Math.random()*101);
		//console.log(random);
		if (random<30) {
			doAnim=false;
		}
		else {
			doAnim=true;
		}
		if (doAnim) {
			var bgY = $.curCSS(tile,'background-position-y');
			if (bgY=="") {
				bgY = $.curCSS(tile,'backgroundPosition');
			}
			if(!bgY){//FF2 no inline-style fallback
				bgY = '0px 0px';
			}
			if (bgY.length<=5) {
				bgY = '0px '+bgY;
			}
			var pos=toArray(bgY);
			var nextState;
			switch (pos[2]) {
				case 0:
					nextState='animateHalf';
					break;
				case 86:
					nextState='animateDown';
					break;
				case 173:
					nextState='animateUp';
					break;
				default:
					alert('You messed up!');
					break;
			};
			Tile[nextState](tile);
			var dbgText='bgPosY: '+pos[2]+'<br/>nextState: '+nextState+'<br/>curTile:'+index;
			//Tile.log(dbgText);
			return;
		}
		//Tile.log('random int lower than 20, delaying animation... ('+random+')');
	},
	'animateLoop': function (tiles) {
		var l = tiles.length;
		var random=Math.floor(Math.random()*l);
		var cur=tiles[random];
		Tile.animateNext(cur,random);
		var delay=function(){Tile.animateLoop(tiles)};
		animCounter=setTimeout(delay, 2500);
	},
	'init': function (page) {
		//Tile.log('Animation initiated!');
		var tiles=$(document.getElementById(page)).find('.animate');
		var l=tiles.length;
		if (l==0) {
			return;
		}
		var delay=function(){Tile.animateLoop(tiles)};
		animCounter=setTimeout(delay, 2500);
		//$('a[onclick^="Tile"]').find('span').html('click to stop tile animation');
		//$('a[onclick^="Tile"]').attr('onclick','Tile.stop()');
	},
	'stop': function () {
		clearTimeout(animCounter);
		//$('a[onclick^="Tile"]').find('span').html('click to start tile animation');
		//$('a[onclick^="Tile"]').attr('onclick',"Tile.init('main-screen')");
		//Tile.log('Animation counter cleared!');
	},
	'log': function (msg) {
		document.getElementById('tileDebug').innerHTML='Debug:<br/>'+msg;
	}
}

function updateActive(id) {
	var color=saveData['Settings'].accent;
	$('span.accent-text').removeClass(color+'-text accent-text');
	$('.'+id).children('span').addClass(color+'-text accent-text');
	data.active=id;
}

function scrollToLetter(letter) {
	window.scroll(0,$('#list-divider-'+letter).offset().top);
}

function scrollUp() {
	window.scroll(0,0);
}

function toArray(strg){
    strg = strg.replace(/([0-9\.]+)(\s|\)|$)/g,"$1px$2");
    var res = strg.match(/(-?[0-9\.]+)(px|\%|em|pt)\s(-?[0-9\.]+)(px|\%|em|pt)/);
    return [parseFloat(res[1],10),res[2],parseFloat(res[3],10),res[4]];
}
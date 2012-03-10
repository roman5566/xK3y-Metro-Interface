window.dhtmlHistory.create({
        toJSON: function(o) {
                return JSON.stringify(o);
        }
        , fromJSON: function(s) {
                return JSON.parse(s);
        }
});

var yourListener = function(newLocation, historyData) {
        console.log(newLocation);
		console.log(historyData);
		getCurrentPage();
}

window.onload = function() {
        dhtmlHistory.initialize();
        dhtmlHistory.addListener(yourListener);
};


$(document).ready(function() {
	getData();
	getCurrentPage();
	$(document).delegate('.lists', 'click', function() {
		$('#main-screen').removeClass('active-page').addClass('inactive-page');
		$('#list-page').removeClass('inactive-page').addClass('active-page');
		window.location.hash='#list-page';
	});
});

function getCurrentPage() {
	var hash = window.location.hash;
	console.log(hash.length);
	if (hash.length != 0) {
		$('#main-screen').removeClass('active-page').addClass('inactive-page');
		$(hash).removeClass('inactive-page').addClass('active-page');
	}
	else {
		$('#main-screen').removeClass('inactive-page').addClass('active-page');
		$('#list-page').removeClass('active-page').addClass('inactive-page');
	}
}

//Some global variables needed
var data;
var saveData;

//Main function, grabs all data from xk3y and parses it
function getData() {
	$.ajax({
		type: "GET",
		url: "data.xml",
		dataType: "xml",
		cache: false,
		success: function(xml) {
			var dirs = [];
			var ISOlist = [];
			var drives = [];
			var about = [];
			var cache = [];
			var iso;
			var id;
			var par;
			var dir;
			var coversrc;
			var isodata;
			var cacheImage;
			//Array of HDDs
			$(xml).find('MOUNT').each(function() {
				drives.push($(this).attr('NAME'));
			});
			//Parse ISO data
			$(xml).find('ISO').each(function() {
				iso = $(this).find('TITLE').text().replace(/\.iso/gi,"");
				id = $(this).find('ID').text();
				par = $(this.parentNode).attr('NAME');
				coversrc = "covers/"+id+".jpg";
				isodata = { 
						"id" : id, 
						"name" : iso, 
						"image" : coversrc, 
						"par" : par };
				ISOlist.push(isodata);
				//Cache images
				cacheImage = new Image();
				cacheImage.src = "covers/"+id+".jpg";
				cache.push(cacheImage);
			});
			//Directories
			$(xml).find('DIR').each(function() {
				dir = $(this).attr('NAME');
				par = $(this.parentNode).attr('NAME');
				dirs.push({"dir" : dir, "par" : par});
			});
			//About info
			$(xml).find('ABOUT').find('ITEM').each(function() {
				about.push({item: $(this).attr('NAME'), value: $(this).text()});
			});
			//Put everything into the data JSON object
			data = { 
				"dirs" : dirs, 
				"ISOlist" : ISOlist, 
				"drives" : drives, 
				"about" : about 
			};
			//Serverside storage
			$.ajax({
				type: "GET",
				url: "store.sh",
				dataType: "json",
				cache: false,
				success: function(response) {
					if (response == null || response == "") {
						//Nothing saved yet? Make a new empty object
						saveData={};
					}
					else {
						//Else use the saved stats
						saveData=response;
					}
					//Experimental pre-loading of the probably most used menus
					makeListPage();
				},
				error: function() {
					//Still make a new empty object, so we can still use it this session
					saveData={};
					//Experimental pre-loading of the probably most used menus
					makeListPage();
				}
			});
		}
	});
}

function makeListPage() {
	//Copy the ISOList! We don't want to mess up the other menus
	var ISOlist = data.ISOlist.slice();
	//Make it alpabetically listed
	ISOlist.sort(function(x,y) { 
		var a = String(x.name).toUpperCase(); 
		var b = String(y.name).toUpperCase(); 
		if (a > b) 
			return 1 
		if (a < b) 
			return -1 
		return 0; 
	});
	var iso;
	var id;
	var cover;
	var letter;
	var stored;
	var dataChange=false;
	var timesPlayed;
	var HTML='<div class="spacer"></div>';
	for (var i=0;i<=ISOlist.length-1;i++) {
		iso = ISOlist[i].name;
		id = ISOlist[i].id;
		cover = ISOlist[i].image;
		letter = iso.charAt(0).toLowerCase();
		stored = saveData[id];
		timesPlayed;
		if (stored == null) {
			saveData[id] = {"timesPlayed": 0, "lastPlayed": 0};
			timesPlayed = 0;
			dataChange=true;
		}
		else timesPlayed = stored.timesPlayed;
		if (HTML.indexOf('list-divider-'+letter)==-1) {
			HTML+='<div class="list-item" id="list-divider-'+letter+'"><div class="list-divider">'+letter+'</div></div>';
		}
		HTML+='<div class="list-item" id="'+id+'"><div class="list-item-icon"></div><span class="list-item-text">'+iso+'</span></div>';
	}
	//Native approach should be faster
	document.getElementById('list-page').innerHTML=HTML;
	
	if (dataChange) {
		$.post('store.sh',JSON.stringify(saveData));
	}
}
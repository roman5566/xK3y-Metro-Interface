var firstLoad=true;
var colors = ['blue','red','green','mango','pink','brown','lime','teal','purple','magenta'];
var dropDownFlag;

$(document).ready(function() {
	getData();
});

$(window).hashchange(function() {
	getCurrentPage()
});

function getCurrentPage() {
	var hash = window.location.hash;
	if (hash.length != 0) {
		showPage(hash);
	}
	else {
		showPage();
	}
}

function showPage(page) {
	var allPages=[];
	var args;
	if (page==null) {
		page='#main-screen';
	}
	if (page.indexOf('?')!=-1) {
		args=page.split('?',2);
		page=args[0];
	}
	if (page=='#overlay' && firstLoad) {
		//page='#list-page';
		//window.location.hash=page;
		history.back();
	}
	if (page.indexOf('#')!=0) {
		page = '#'+page;
	}
	$('.page').each(function() {
		allPages.push('#'+this.id);
	});
	for (var i=0;i<allPages.length;i++) {
		if ($(allPages[i]).hasClass('active')) {
			$(allPages[i]).removeClass('active');
		}
	}
	if (!$(page).hasClass('active')) {
		$(page).addClass('active');
	}
	if (args!=null) {
		if (page=='#details-page') {
			var tmp=args[1].split('&',2);
			prepDetails(tmp[0],unescape(tmp[1]));
		}
		else if (page=='#list-page') {
			scrollToLetter(args[1]);
		}
		
		if (args[1]=='grey') {
			$(args[0]).css('background-color','#181C18');
		}
		else if (args[1]=='black') {
			$(args[0]).css('background-color','');
		}
	}
	return true;
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
	$('.accent').removeClass(cur).addClass(color);
	$('.accent-text').removeClass(cur+'-text').addClass(color+'-text');
	$('.accent-border').removeClass(cur+'-border').addClass(color+'-border');
	$('#accentSelect span').html(color);
	saveData['Settings'].accent=color;
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
		setTimeout('dropDownFlag=false',1);
	}
}

var MessageBox = {
	'Show': function (title, text, buttonHTML) {
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
		else {
			accent=settings.accent;
		}
		accentChange(accent);
	},
	
	'save': function () {
		$.post('store.sh', JSON.stringify(saveData));
	},
	
	'firstRun': function () {
		//First run settings, defaults go here
		var settings = {};
		settings.accent='blue';
		saveData['Settings']=settings;
		Settings.save();
		Settings.init();
	}
	
}

function scrollToLetter(letter) {
	window.scroll(0,$('#list-divider-'+letter).offset().top);
}

function scrollUp() {
	window.scroll(0,0);
}
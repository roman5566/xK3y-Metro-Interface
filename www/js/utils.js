var firstLoad=true;

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
	if (page=='#overlay' && firstLoad) {
		page='#list-page';
		window.location.hash=page;
	}
	if (page.indexOf('?')!=-1) {
		args=page.split('?',2);
		page=args[0];
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
	}
	appBar(page);
	firstLoad=false;
	return true;
}

function appBar(page) {
	if (page=='#main-screen' || page=='#overlay' || page=='#details-page') {
		if ($('#appBar').hasClass('active')) {
			$('#appBar').removeClass('active');
		}
	}
	else {
		if (!$('#appBar').hasClass('active')) {
			$('#appBar').addClass('active');
		}
	}
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
			HTML+='<a href="#list-page?'+letters[i]+'"><div class="overlay-item">'+letters[i]+'</div></a>'
		}
		cur++;
		if(cur == 4) {
			HTML+='<br/>';
			cur=0;
		}
	}
	document.getElementById('overlay').innerHTML=HTML;
}

var MessageBox = {
	Show: function (title, text, buttonHTML) {
		var HTML = '<span class="messagebox-title">'+title+'</span>';
		HTML +=	'<span class="messagebox-text">'+text+'</span>';
		if (buttonHTML==null) {
			HTML += '<a class="button" href="javascript:MessageBox.Close();" style="float:left">Ok</a><a class="button" href="javascript:MessageBox.Close();" style="float:right">Cancel</a>';
		}
		else {
			HTML += buttonHTML+'<a class="button" href="javascript:MessageBox.Close();" style="float:right">Cancel</a>';
		}
		$('#MessageBox').html(HTML);
		$('#MessageBox').addClass('active');
	}, 
	Close: function () {
		$('#MessageBox').removeClass('active');
	}
}

function scrollToLetter(letter) {
	window.scroll(0,$('#list-divider-'+letter).offset().top);
}
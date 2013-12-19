/**
 * Namespace
 */
var Terminal = Terminal || {};
var Command  = Command  || {};

// Note: The file system has been prefixed as of Google Chrome 12:
window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;

/**
 * FilesystemErrorHandler
 */
Terminal.FilesystemErrorHandler = function(event) {
    
    // Case
    var msg = '';
    switch (event.code) {
        case FileError.QUOTA_EXCEEDED_ERR:
            msg = 'QUOTA_EXCEEDED_ERR';
            break;
        case FileError.NOT_FOUND_ERR:
            msg = 'NOT_FOUND_ERR';
            break;
        case FileError.SECURITY_ERR:
            msg = 'SECURITY_ERR';
            break;
        case FileError.INVALID_MODIFICATION_ERR:
            msg = 'INVALID_MODIFICATION_ERR';
            break;
        case FileError.INVALID_STATE_ERR:
            msg = 'INVALID_STATE_ERR';
            break;
        default:
            msg = 'Unknown Error';
            break;
    }

    // Log
    console.log('Filesystem Error: ' + msg);
};

/**
 * Terminal Events
 */
Terminal.Events = function(inputElement, OutputElement) {
    
    // Set Root Pointer
    window.requestFileSystem(window.TEMPORARY, 1024*1024, function(fs) {Terminal.Filesystem.pwd = fs.root}, Terminal.FilesystemErrorHandler);
    
    // Sets
    var input = document.getElementById(inputElement);
    var body  = document.getElementById('body');
      
    // Input Keypress
    input.onkeydown = function(event) {
        if (event.which == 13 || event.keyCode == 13) {
            
            // Input Value
            var inputValue = input.value;
            var output     = new Terminal.Output(OutputElement);
            
            // Check Command Empty
            if (inputValue == '') {
                return false;
            }
            
            // Command
            var inputParse = inputValue.split(' ');
            var command    = inputParse[0].toLowerCase();
            
            // Get Command
            var commandInstance = Command.Factory.create(command);
            var fsCallback      = commandInstance.getFsCallback(inputParse, output);

            // Execute FileSystem Function
            if (!(fsCallback instanceof Terminal.Output)) {
                window.requestFileSystem(window.TEMPORARY, 1024*1024, fsCallback, Terminal.FilesystemErrorHandler);
            }
            
            // Clear Input
            input.value = '';
        }
        return true;
    };
    
    // Click Body
    body.onclick = function() {
        input.focus();
    };
};

/**
 * Output
 */
Terminal.Output = function(element) {
    
    // OutputElemen
    var outputElement = document.getElementById(element);
    
    // White
    this.write = function(content) {
        var fromContent = outputElement.innerHTML;
        fromContent += '<div class="cmd-output">';
        fromContent += content;
        fromContent += '</div>';
        outputElement.innerHTML = fromContent;
        return this;
    };
    
    this.clear = function() {
        outputElement.innerHTML = '';
        return this;
    };
};

/**
 * Terminal Filesystem Pointer
 */
Terminal.Filesystem = {
    pwd: null
};

/**
 * Command Ls
 */
Command.Ls = {
    getFsCallback: function(input, output) {
        // FileSystem
        return function() {
            // Read
            Terminal.Filesystem.pwd.createReader().readEntries(function(result) {
                // Ls Options
                var lsClass = (input[1] == '-l' ? 'filesystem-ls-l' : 'filesystem-ls');
                // Content
                var content = '<div class="' + lsClass+ '">';
                // Iteration
                for (var i = 0; i < result.length; i++) {
                    content += '<span class="' + (result[i].isFile == true ? 'is-file' : 'is-dir') + '">' + result[i].name + '</span>';
                }
                // Content
                content += '</div>';
                // Output
                output.write(content);
            }, Terminal.FilesystemErrorHandler); 
        };
    }
};

/**
 * Command Mkdir
 */
Command.Mkdir = {
    getFsCallback: function(input, output) {
        
        // Check Params
        if (input[1] == null) {
            return output.write('Parameters missing, make this thing right');;
        }
        
        // Filesystem
        return function() {
            
            // Add Dir
            Terminal.Filesystem.pwd.getDirectory(input[1], {create: true}, function() {}, Terminal.FilesystemErrorHandler);
            
        };
    }
};

/**
 * Command Cd
 */
Command.Cd = {
    getFsCallback: function(input, output) {
         // Check Params
        if (input[1] == null) {
            return output.write('Parameters missing, make this thing right');
        }
        // Filesystem
        return function() {
            // Add directory pointer
            Terminal.Filesystem.pwd.getDirectory(input[1], {}, function(dirEntity) {
                Terminal.Filesystem.pwd = dirEntity;
            });
        };
    }
};

/**
 * Command Rm
 */
Command.Rm = {
    getFsCallback: function(input, output) {
        // Check Params
        if (input[1] == null) {
            return output.write('Parameters missing, make this thing right');
        }
        // Filesystem
        return function() {
            // Check Recusively
            if (input[1] == '-R') {
                // Get Dir
                Terminal.Filesystem.pwd.getDirectory(input[2], {}, function(dirEntry) {
                    // Remove Dir Recursively
                    dirEntry.removeRecursively(function() {}, Terminal.FilesystemErrorHandler);
              }, Terminal.FilesystemErrorHandler);
            } else {
                // Touch File
                Terminal.Filesystem.pwd.getFile(input[1], {}, function(fileEntry) {
                    // Remove File
                    fileEntry.remove(function() {}, Terminal.FilesystemErrorHandler);
                }, Terminal.FilesystemErrorHandler);
            }
            
        };
    }
};

/**
 * Command Mv
 */
Command.Mv = {
    getFsCallback: function(input, output) {
        return output.write('Not implemented');
    }
};

/**
 * Command Help
 */
Command.Help = {
    getFsCallback: function(input, output) {
        var helpContent = '';
        helpContent += '<strong>HELP MENU:</strong>'
        //helpContent += '<div><strong>cd</strong>     [cd "dir"] [cd ..]         | Navigate on directories</div>';
        helpContent += '<div><strong>clear&nbsp;&nbsp;</strong>&nbsp;                  | Clear terminal screen</div>';
        helpContent += '<div><strong>date&nbsp;&nbsp;&nbsp;</strong>&nbsp;            | Display the date & time</div>';
        helpContent += '<div><strong>help&nbsp;&nbsp;&nbsp;</strong>&nbsp;            | Display a list of system commands</div>';
        helpContent += '<div><strong>ifconfig</strong>&nbsp;| Configure a network interface</div>';
        //helpContent += '<div><strong>ls</strong>     [ls] [ls -l]               | List files and directories</div>';
        //helpContent += '<div><strong>mkdir</strong>  [mkdir "dir name"]         | Create new directory</div>';
        //helpContent += '<div><strong>mv</strong>     [mv "to" "from"]           | Move the files or directories</div>';
        //helpContent += '<div><strong>rm</strong>     [rm "file"] [rm -R "dir"]  | Remove files</div>';
        helpContent += '<div><strong>version</strong>&nbsp;                          | Show the version</div>';
        helpContent += '<div><strong>who&nbsp;&nbsp;&nbsp;&nbsp;</strong>&nbsp;       | Print all usernames currently logged in</div>';
        helpContent += '<br><div class="highlight">This is a webpage terminal simulator based on my former project--Hacker GO.I will appreciate it if you could help me finish this project.</div><div>Type "github" to view this project on Github!</div><br>'
        return output.write(helpContent);
    }
};

/**
 * Command Clear
 */
Command.Clear={
    getFsCallback:function(input, output){
        return output.clear();
    }
};
/**
 * Command Version
 */
Command.Version={
    getFsCallback:function(input,output){
        return output.write('alpha 0.1 build131219_001');
    }
};
/**
 * Command Date
 */
Command.Date={
    getFsCallback:function(input,output){
        var mydate=new Date();
        return output.write(mydate.toLocaleString());
    }
};
/**
 * Command Who
 */
Command.Who={
    getFsCallback:function(input,output){
        return output.write('<div class="highlight">Hacker GO!! - By:<a href="http://jok3r.ueuo.com" style="text-decoration:none;" target="_blank">Jok3r</a> &lt;j.kuo2012@gmail.com&gt;</div>');
    }
};
/**
 * Command Ifconfig
 * Get IP with an interface of Sina.com.cn(http://counter.sina.com.cn/ip/)
 */
Command.Ifconfig={
    getFsCallback:function(input,output){
        return output.write('IP address：'+ILData[0]+'<br>MAC address：function not supported<br>');
    }
};
/**
 * Command Github
 */
Command.Github={
    getFsCallback:function(input,output){
        window.open('https://github.com/Jing0/Web-Terminal');
        return output.write('Done!Thanks if you can help me!');
    }
};
/**
 * Command Not Found
 */
Command.Notfound={
    getFsCallback:function(input, output){
        return output.write('command not found');
    }
};
/**
 * Terminal CommandFactory
 */
Command.Factory={
    commandMap : {
      //'cd'    : Command.Cd,
      'clear' : Command.Clear,
      'date'  : Command.Date,
      'help'  : Command.Help,
      'ifconfig':Command.Ifconfig,
      //'ls'    : Command.Ls,
      //'mkdir' : Command.Mkdir,
      //'mv'    : Command.Mv,
      //'rm'    : Command.Rm,
      'version':Command.Version,
      'who'   : Command.Who,
      'github': Command.Github,
    },
  
    create: function(option) {
        if (this.commandMap[option] != null) {
            return this.commandMap[option];
        }      
        return Command.Notfound;        
    }
};

/* get browser info */
function browInfo(){
    document.getElementById("browser").innerHTML="Browser:"+navigator.appName+" "+navigator.appVersion
}
/* get current time */
function startTime(){
    var today=new Date();
    var y=today.getFullYear();
    var mon=today.getMonth();
    var d=today.getDay()+1;
    var h=today.getHours();
    var m=today.getMinutes();
    var s=today.getSeconds();
    // add a zero in front of numbers<10
    mon=checkTime(mon)
    d=checkTime(d)
    h=checkTime(h)
    m=checkTime(m)
    s=checkTime(s)
    document.getElementById("date").innerHTML="Time:"+y+"."+mon+"."+d+" "+h+":"+m+":"+s
    t=setTimeout('startTime()',500)
}
function checkTime(i){
    if (i<10) 
    {i="0" + i}
    return i;
}

/**
 * Window Load
 */
window.onload = function() {
    browInfo();
    startTime();
    new Terminal.Events('cmdline', 'output');
};

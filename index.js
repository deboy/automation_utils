var express = require("express");
var path = require("path");
var fs = require("fs");
var exec = require('child_process');
var bodyparser = require('body-parser');
var app = express();
var pathname = path.join(__dirname, "public");
var os = require("os");

app.use(express.static(pathname));
app.use(bodyparser.json());

function readFileAsync(filePath, ext){
    return new Promise(function(resolve, reject){
        fs.readdir(filePath, function(err, files){
            if(err){
                reject(err);
                return;
            }
            var result = [];
            files.forEach(function(file){
                if(file.endsWith(ext)){
                    result.push({
                        name: file,
                        value: file
                    });
                }
            });
            resolve(result);
        })
    })
}

function getChromeDriverVersion(){
    return new Promise(function(resolve, reject){
        var cmd = 'c:\\dev\\SeleniumDrivers\\chromedriver.exe -version';
        exec.exec(cmd, function(error, stdout, stderr){
            if(error){
                reject(error);
            }else{
                var result = stdout.replace('ChromeDriver ', '').replace(/(\.)[\w\W]+/, '');
                resolve(result);
            }
        });
    })
}

function isTargetFolderEmpty(folderName){
    return new Promise(function(resolve, reject){
        fs.readdir(folderName, function(err, files) {
            if (err) {
                reject(err);
            } else {
                resolve(files.length == 0);
            }
        });
    });
}

function isJarPathSet(batFilePath, batFileName){
    var _path = path.join(batFilePath, batFileName);
    var batContent = fs.readFileSync(_path, 'utf8');

    if(batContent.indexOf(batFilePath) != -1){
        return true;
    }else{
        return false;
    }
}

function isTargetSiteSet(caseRootPath, targetSite){
    var _path = path.join(caseRootPath, 'testscript\\module\\Login.xml');
    var batContent = fs.readFileSync(_path, 'utf8');

    if(batContent.indexOf(targetSite) != -1){
        return true;
    }else{
        return false;
    }
}

function getReportMailToAddress(caseRootPath){
    var _path = path.join(caseRootPath, 'testscript\\TestRunSummary.xml');
    var batContent = fs.readFileSync(_path, 'utf8');
    var toAddress = batContent.match(/<TestData key=\"SendMailTo\">([^<]+)<\/TestData>/);
    return toAddress[1];
}

function deleteFiles(path) {
    let files = [];
    if(fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach(function (file, index) {
            let curPath = path + "/" + file;
            if(fs.statSync(curPath).isDirectory()) { // recurse
                deleteall(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
    }
};

function isReportXMLSet(batFilePath, batFileName){
    var _path = path.join(batFilePath, batFileName);
    var batContent = fs.readFileSync(_path, 'utf8');

    if(batContent.indexOf("TestRunSummary.xml") != -1){
        return true;
    }else{
        return false;
    }
}

app.post('/bat_file_list',async function(req, res){
    var responseData = await readFileAsync(req.body.caseRootPath, '.bat');
    res.json({
        code: 200,
        status: true,
        message: "",
        data: responseData
    });
});

app.post('/check_user_input', async function(req, res){
    var caseRootPath = req.body.caseRootPath;
    var targetSite = req.body.targetSite;
    var batFileName = req.body.batFileName;
    var version = await getChromeDriverVersion();
    var isLogFolderEmpty = await isTargetFolderEmpty('c:\\Logs');
    var jarPathSet = isJarPathSet(caseRootPath, batFileName);
    res.json({
        code: 200,
        status: true,
        message: "",
        data: {
            chromeDriverVersion: version,
            isLogFolderEmpty: isLogFolderEmpty,
            isJarPathSet: jarPathSet,
            isTargetSiteSet: isTargetSiteSet(caseRootPath, targetSite),
            reportToAddress: getReportMailToAddress(caseRootPath),
            isReportXMLSet: isReportXMLSet(caseRootPath, batFileName),
        }
    });
});

app.post('/clear_up_log_folder', async function(req, res){
    deleteFiles('c:\\Logs');
    var isLogFolderEmpty = await isTargetFolderEmpty('c:\\Logs');
    res.json({
        code: 200,
        status: true,
        message: "",
        data: isLogFolderEmpty
    });
})

app.post('/add_report_xml_to_bat', async function(req, res){
    var caseRootPath = req.body.caseRootPath;
    var batFileName = req.body.batFileName;

    var batContent = fs.readFileSync(path.join(caseRootPath, batFileName), 'utf8');
    fs.writeFileSync(path.join(caseRootPath, batFileName), batContent + 'java -jar %jarfile% "%scriptsfolder%\\testscript\\TestRunSummary.xml"' + os.EOL);
    res.json({
        code: 200,
        status: true,
        message: "",
        data: isReportXMLSet(caseRootPath, batFileName)
    });
})

app.post('/modify_bat_file_env_path', async function(req, res){
    var caseRootPath = req.body.caseRootPath;
    var batFileName = req.body.batFileName;

    var batContent = fs.readFileSync(path.join(caseRootPath, batFileName), 'utf8');

    var matchResult = batContent.match(/set scriptsfolder=(.+)\r\n/);

    batContent = batContent.replaceAll(matchResult[1], caseRootPath);

    fs.writeFileSync(path.join(caseRootPath, batFileName), batContent);

    res.json({
        code: 200,
        status: true,
        message: "",
        data: true
    });
})

app.post('/set_report_email_address', async function(req, res){
    var caseRootPath = req.body.caseRootPath;
    var emailAddress = req.body.emailAddress;

    var _path = path.join(caseRootPath, 'testscript\\TestRunSummary.xml');
    var batContent = fs.readFileSync(_path, 'utf8');
    batContent = batContent.replace(/<TestData key=\"SendMailTo\">([^<]+)<\/TestData>/g, '<TestData key="SendMailTo">' + emailAddress + '</TestData>');
    fs.writeFileSync(_path, batContent);

    res.json({
        code: 200,
        status: true,
        message: "",
        data: getReportMailToAddress(caseRootPath) == emailAddress
    });
})

app.post('/set_target_site', async function(req, res){
    var caseRootPath = req.body.caseRootPath;
    var targetSite = req.body.targetSite;

    var _path = path.join(caseRootPath, 'testscript\\module\\Login.xml');
    var batContent = fs.readFileSync(_path, 'utf8');
    batContent = batContent.replace(/\(~PERSISTEDDATA\(Parent\.BROWSERURL\),[^)]+\)/g, '(~PERSISTEDDATA(Parent.BROWSERURL),'+ targetSite +')');
    fs.writeFileSync(_path, batContent);

    res.json({
        code: 200,
        status: true,
        message: "",
        data: true
    });
})

app.post('/start_run', async function(req, res){
    var caseRootPath = req.body.caseRootPath;
    var batFileName = req.body.batFileName;

    exec.execFile(batFileName, [1, 2], {cwd: caseRootPath}, function(error, stdout, stderr) {
    });

    res.json({
        code: 200,
        status: true,
        message: "",
        data: true
    });
})

app.listen(80);

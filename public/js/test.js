



$(function(){
    var caseRootFolder = '';

    if(localStorage.getItem('Case_Root_Folder_Path')){
        caseRootFolder = localStorage.getItem('Case_Root_Folder_Path');
        $('#caseRootFolder').val(caseRootFolder);
    }

    function getChromeVersion() {
        var arr = navigator.userAgent.split(' '); 
        var chromeVersion = '';
        for(var i=0;i < arr.length;i++){
            if(/chrome/i.test(arr[i]))
            chromeVersion = arr[i]
        }
        if(chromeVersion){
            return Number(chromeVersion.split('/')[1].split('.')[0]);
        } else {
            return false;
        }
    }

    $("#tableCheckResult").hide();


    var BindEvent = function(){
        $('body').on('click', '#checkRootFolderBtn', function(e){
           if($('#caseRootFolder').val().trim() == ''){
               alert('请输入Runnable的根目录');
               return;
           }

           caseRootFolder = $('#caseRootFolder').val().trim();

           $.ajax({
               type: 'POST',
               url: '/bat_file_list',
               contentType: 'application/json',
               data: JSON.stringify( { caseRootPath: caseRootFolder }),
               success: function(responseData){
                if(responseData && Array.isArray(responseData.data)){
                    $('#divSecondStep').show();
                    localStorage.setItem('Case_Root_Folder_Path', caseRootFolder);
                    $("#selectBatFile").empty();
                    $("#selectBatFile").append('<option value="-1">-</option>');
                    $("#selectBatFile").val('-1');
                    for(var i = 0; i< responseData.data.length; i++){
                        $("#selectBatFile").append('<option value="' + responseData.data[i].value + '">' + responseData.data[i].name + '</option>');
                    }
                }
               },
               error: function(xhr, type){
                alert('Ajax error!')
              }
           })
        });

        $('body').on('click', '#btnStartCheck', function(e){
            if($("#caseRootFolder").val().trim() == ''){
                alert('请输入Runnable的根目录');
                return;
            }
            if($("#target_site").val() == ''){
                alert('请选择自动化站点');
                return;
            }
            if($("#selectBatFile").val() == '-1'){
                alert('请选择脚本集合');
                return;
            }

            $.ajax({
                type: 'POST',
                url: '/check_user_input',
                contentType: 'application/json',
                data: JSON.stringify( { 
                    caseRootPath: caseRootFolder,
                    targetSite: $("#target_site").val(),
                    batFileName: $("#selectBatFile").val()
                }),
                success: function(responseData){
                 if(responseData && responseData.data){
                    $("#tableCheckResult").show();
                    responseData = responseData.data;
                    var brownserVersion = getChromeVersion() + '';
                    $("#spanLocalBrownserVersion").html(brownserVersion);
                    $("#spanChromeDriverVersion").html(responseData.chromeDriverVersion);
                    if(brownserVersion != responseData.chromeDriverVersion){
                        $("#spanBrownser").html("版本不一致，请手动替换");
                        $("#spanBrownser").parent().parent().css({background: "red"});
                    }else{
                        $("#spanBrownser").html("通过");
                        $("#spanBrownser").parent().parent().css({background: "green"});
                    }

                    if(responseData.isJarPathSet){
                        $("#isJarPathSetPass").html("通过");
                        $("#setJarPathBtn").hide();
                        $("#isJarPathSetPass").parent().parent().css({background: "green"});
                    }else{
                        $("#isJarPathSetPass").html("没有设置文件夹路径");
                        $("#setJarPathBtn").show();
                        $("#isJarPathSetPass").parent().parent().css({background: "red"});
                    }

                    if(responseData.isLogFolderEmpty){
                        $("#isLogFolderEmpty").html("通过");
                        $("#cleanUpLogFolder").hide();
                        $("#isLogFolderEmpty").parent().parent().css({background: "green"});
                    }else{
                        $("#isLogFolderEmpty").html("Logs 文件夹不为空");
                        $("#cleanUpLogFolder").show();
                        $("#isLogFolderEmpty").parent().parent().css({background: "red"});
                    }

                    if(responseData.isTargetSiteSet){
                        $("#isTargetSiteSet").html("通过");
                        $("#setTargetSite").hide();
                        $("#isTargetSiteSet").parent().parent().css({background: "green"});
                    }else{
                        $("#isTargetSiteSet").html("自动化站点没有设置");
                        $("#setTargetSite").show();
                        $("#isTargetSiteSet").parent().parent().css({background: "red"});
                    }

                    if(responseData.isReportXMLSet){
                        $("#isReportXMLSet").html("通过");
                        $("#addRportXMl").hide();
                        $("#isReportXMLSet").parent().parent().css({background: "green"});
                    }else{
                        $("#isReportXMLSet").html("没有包含report的XML");
                        $("#addRportXMl").show();
                        $("#isReportXMLSet").parent().parent().css({background: "red"});
                    }

                    if(responseData.reportToAddress == $('#reportEmailAddress').val().trim()){
                        $("#reportToAddress").html("通过");
                        $("#setToAddress").hide();
                        $("#reportToAddress").parent().parent().css({background: "green"});
                    }else{
                        $("#reportToAddress").html("邮件地址没有设置");
                        $("#setToAddress").show();
                        $("#reportToAddress").parent().parent().css({background: "red"});
                    }

                    
                 }
                },
                error: function(xhr, type){
                 alert('Ajax error!')
               }
            })
        });

        $('body').on('click', '#cleanUpLogFolder', function(e){

            var t = prompt('确定要清空Logs文件夹吗，此操作不可回滚', "Yes");
            if(t != "Yes") return;

            $.ajax({
                type: 'POST',
                url: '/clear_up_log_folder',
                contentType: 'application/json',
                data: "",
                success: function(responseData){
                 if(responseData && typeof responseData.data == "boolean"){
                    if(responseData.data){
                        alert("Logs 文件夹已清空");
                        $("#isLogFolderEmpty").html("通过");
                        $("#cleanUpLogFolder").hide();
                        $("#isLogFolderEmpty").parent().parent().css({background: "green"});
                    }
                 }
                },
                error: function(xhr, type){
                 alert('Ajax error!')
               }
            })
        });

        $('body').on('click', '#addRportXMl', function(e){
            $.ajax({
                type: 'POST',
                url: '/add_report_xml_to_bat',
                contentType: 'application/json',
                data: JSON.stringify( { 
                    caseRootPath: caseRootFolder,
                    batFileName: $("#selectBatFile").val()
                }),
                success: function(responseData){
                 if(responseData && typeof responseData.data == "boolean"){
                    if(responseData.data){
                        alert("添加成功");
                        $("#isReportXMLSet").html("通过");
                        $("#addRportXMl").hide();
                        $("#isReportXMLSet").parent().parent().css({background: "green"});
                    }
                 }
                },
                error: function(xhr, type){
                 alert('Ajax error!')
               }
            })
        });

        $('body').on('click', '#setJarPathBtn', function(e){
            $.ajax({
                type: 'POST',
                url: '/modify_bat_file_env_path',
                contentType: 'application/json',
                data: JSON.stringify( { 
                    caseRootPath: caseRootFolder,
                    batFileName: $("#selectBatFile").val()
                }),
                success: function(responseData){
                 if(responseData && typeof responseData.data == "boolean"){
                    if(responseData.data){
                        alert("修改成功");
                        $("#isJarPathSetPass").html("通过");
                        $("#setJarPathBtn").hide();
                        $("#isJarPathSetPass").parent().parent().css({background: "green"});
                    }
                 }
                },
                error: function(xhr, type){
                 alert('Ajax error!')
               }
            })
        });

        $('body').on('click', '#setToAddress', function(e){
            $.ajax({
                type: 'POST',
                url: '/set_report_email_address',
                contentType: 'application/json',
                data: JSON.stringify( { 
                    caseRootPath: caseRootFolder,
                    emailAddress: $('#reportEmailAddress').val()
                }),
                success: function(responseData){
                 if(responseData && typeof responseData.data == "boolean"){
                    if(responseData.data){
                        alert("修改成功");
                        $("#reportToAddress").html("通过");
                        $("#setToAddress").hide();
                        $("#reportToAddress").parent().parent().css({background: "green"});
                    }
                 }
                },
                error: function(xhr, type){
                 alert('Ajax error!')
               }
            })
        });

        $('body').on('click', '#setTargetSite', function(e){
            $.ajax({
                type: 'POST',
                url: '/set_target_site',
                contentType: 'application/json',
                data: JSON.stringify( { 
                    caseRootPath: caseRootFolder,
                    targetSite: $('#target_site').val()
                }),
                success: function(responseData){
                 if(responseData && typeof responseData.data == "boolean"){
                    if(responseData.data){
                        alert("修改成功");
                        $("#isTargetSiteSet").html("通过");
                        $("#setTargetSite").hide();
                        $("#isTargetSiteSet").parent().parent().css({background: "green"});
                    }
                 }
                },
                error: function(xhr, type){
                 alert('Ajax error!')
               }
            })
        });

        $('body').on('click', '#startRun', function(e){
            $.ajax({
                type: 'POST',
                url: '/start_run',
                contentType: 'application/json',
                data: JSON.stringify( { 
                    caseRootPath: caseRootFolder,
                    batFileName: $("#selectBatFile").val()
                }),
                success: function(responseData){
                 if(responseData && typeof responseData.data == "boolean"){
                    if(responseData.data){
                        alert("开始运行了。请耐心等待。");
                    }
                 }
                },
                error: function(xhr, type){
                 alert('Ajax error!')
               }
            })
        });
    }
    BindEvent();
});

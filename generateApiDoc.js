
var apilistHeader = "||地址||描述||\n";
// 存放所有的controller数据
var controllerMap = {};
var host = temp1.host;
var baseUrl = temp1.basePath;
var apiData = temp1;
apiData.tags.forEach(function(e, i){controllerMap[e.name] = e.name+" " + e.description;});
var tagsList = {};
// group api by controller
for(var tag in controllerMap) {
	tagsList[tag] = [];
	for(var pathinfo in apiData.paths) {
		var requestInfo = apiData.paths[pathinfo];
		for(var mname in requestInfo) {
            var req = requestInfo[mname];
			req["reqmethod"] = mname
            req["reqpath"] = "http://"+host+baseUrl+pathinfo;
            if (req.tags[0] == tag) {
                tagsList[tag][mname+" http://"+host+baseUrl+pathinfo] = req;
            }
        }		
    }
}
// generate api str
var apidoc = {};
for (var ctrl in tagsList) {
    var reqinfoList = tagsList[ctrl];
    var apidocDetail = "";
    var apiitermindex = 1;
    var apilistTableBody = apilistHeader;
    for (var reqstr in reqinfoList) {
        var reqinfo = reqinfoList[reqstr];
        apilistTableBody += "|[" + reqinfo.reqpath + "]|" + reqinfo.description + "|\n";
        var apiParamBody = "";
        //if (reqinfo.reqpath.indexOf("motorcadeVehicle/deleteManyMotorcadeBindDriver")>= 0) {
        //   debugger;
        //}
        if (reqinfo.parameters) {
            apiParamBody = "\n";
            apiParamBody += "||参数名||类型||是否必填||说明||\n";
            for (let pindex=0,allcount = reqinfo.parameters.length;pindex<allcount;pindex++){
                var paramObj = reqinfo.parameters[pindex];
                if (paramObj.type && paramObj.type != undefined) {
                    // path value
                    apiParamBody +="|" + paramObj.name + "|" + paramObj.type + "|" + (paramObj.required ? "是":"否") + "|" + paramObj.description + "|\n";
                } else {
                    // requestBody
                    if (!paramObj.schema.type || paramObj.schema.type == undefined) {
                        var bodyParamName = paramObj.schema.$ref.split("/")[2];
                        var bodyObj = apiData.definitions[bodyParamName];
                        apiParamBody+=parseBodyParamProps(bodyObj, apiParamBody);
                    } else if (paramObj.schema.items && paramObj.schema.items!=undefined) {
                        var bodyParamName = paramObj.schema.items.$ref.split("/")[2];
                        var bodyObj = apiData.definitions[bodyParamName];
                        apiParamBody+=parseBodyParamProps(bodyObj, apiParamBody);
                    } else {
                        apiParamBody+="|" + paramObj.name + "|" + paramObj.type + "|" + (paramObj.required ? "是":"否") + "|" + paramObj.description + "|\n";
                    }
                }
            }
        }
        var apiiterm = "h1. " +(apiitermindex++) + "." + reqinfo.description + "\n" +
                 "\n" +
                 "h1. 发布状态\n" +
                 "||环境||发布状态||\n" +
                 "|UAT|已发布|\n" +
                 "|预发布环境|未发布|\n" +
                 "|生产环境|未发布|\n" +
                 "h1. Request\n" +
                 "h2. Swagger:\n" +
                 "UAT环境:[" + "http://"+host+baseUrl+"/swagger-ui.html#!/"+reqinfo.tags[0]+"/"+reqinfo.operationId + "]\n" +
                 "预发布环境:\n" +
                 "生产环境:\n" +
                 "||方法||URL||Content-Type||认证要求||\n" +
                 "|" + reqinfo.reqmethod + "|[" + reqinfo.reqpath + "]\n" +
                 "URL以UAT环境为示例，实际请根据具体访问的系统环境，自行调整域名。|application/json|无认证|\n" +
                 "h3. 请求参数\n" +
                 apiParamBody +
                 "h3. 请求示例\n" +
                 "curl -X " + reqinfo.reqmethod + " \\\n" +
                 " [" + reqinfo.reqpath + "] \\\n" +
                 " -H 'Content-Type: " + reqinfo.consumes[0] + "' \\\n" +
                 "\n" +
                 "h3. Response\n" +
                 "响应参数\n" +
                 "||参数名||类型||是否必填||说明||\n" +
                 "|status|String|是|SUCCEED：成功\n" +
                 "FAILED：失败|\n" +
                 "|errorCode|String|否| |\n" +
                 "|errorMessage|String|否|错误提示|\n" +
                 "|data|Object|否|当status为SUCCEED时，有数据返回|\n" +
                 "h3. 响应示例\n" +
                 "{\n" +
                 "   \"status\":\"SUCCEED\",\n" +
                 "   \"data\":{}\n" +
                 "}\n";
                 
        apidocDetail += "\n\n"+apiiterm;
    }
    apilistTableBody += apidocDetail
    apidoc[ctrl] = apilistTableBody;
}
for(var apiname in apidoc) {
    console.log(apiname);
}
// save api to localStorage
localStorage.setItem("apiDoc",JSON.stringify(apidoc));

// resolve requestBody Param
function parseBodyParamProps(bodyp) {
    var apiParamStr = "";
    if (bodyp.type == "object") {
        var properties = bodyp.properties;
        for (p in properties) {
            if (properties[p].type == "object") {
                apiParamStr+="|" + p + "|" + properties[p].type + "| 否|" + p + "|\n";
                apiParamStr += "| | | | |\n";
                apiParamStr += "||参数名||类型||是否必填||说明||\n";
                apiParamStr+=parseBodyParamProps(properties[p], apiParamStr);
            } else if (properties[p].type == "array") {
                if (properties[p].items.$ref && properties[p].items.$ref!=undefined){
                    var bodyParamName = properties[p].items.$ref.split("/")[2];
                    var bodyObj = apiData.definitions[bodyParamName];
                    apiParamStr+="|" + p + "|" + properties[p].type + "| 否|" + p + "|\n";
                    apiParamStr += "| | | | |\n";
                    apiParamStr += "||参数名||类型||是否必填||说明||\n";
                    apiParamStr+=parseBodyParamProps(bodyObj, apiParamStr);
                } else {
                    apiParamStr+="|" + p + "|array(" + properties[p].items.type + ")| 否|" + p + "|\n";
                }
            } else {
                apiParamStr+="|" + p + "|" + properties[p].type + "| 否|" + p + "|\n";
            }
            
        }
    }
    return apiParamStr;
}
// get api by apiname
function getApi(apiname) {
    console.log(JSON.parse(localStorage.getItem("apiDoc"))[apiname]);
}

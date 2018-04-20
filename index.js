require('uppercase-core-common');

// UPPERCASE-CORE-NODE에서 필요한 것들 추가
require('./NODE/NODE_CONFIG.js');
require('./NODE/BOX.js');
// HTTP 요청 관련
require('./NODE/REQUEST/REQUEST.js');
require('./NODE/REQUEST/GET.js');
require('./NODE/REQUEST/POST.js');
require('./NODE/REQUEST/PUT.js');
require('./NODE/REQUEST/DELETE.js');
// 파일 처리 관련
require('./NODE/FILE/CHECK_FILE_EXISTS.js');
require('./NODE/FILE/READ_FILE.js');

const querystring = require('querystring');

global.ENCRYPTION_KEY = '_';

global.CLOUD_FUNCTION = METHOD((m) => {
	
	const avoidColdStartProcesses = [];
	
	// cold start 방지용 처리 추가
	m.addAvoidColdStartProcess = (process) => {
		avoidColdStartProcesses.push(process);
	};
	
	let encrypt = (text) => {
		let result = '';
		let keySize = ENCRYPTION_KEY.length;
		let keyCount = 0;
		for (let i = 0; i < text.length; i += 1) {
			result += String.fromCharCode(text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(keyCount));
			keyCount += 1;
			if (keyCount === keySize) {
				keyCount = 0;
			}
		}
		return result;
	};
	
	return {
		run : (f) => {
			return (req, res) => {
				
				res.set('Access-Control-Allow-Origin', '*');
				
				var data = req.body === '' ? {} : UNPACK_DATA(req.body);
				
				// cold start 방지용 스크립트 실행 시
				if (data.__DONT_COLD_START === true) {
					EACH(avoidColdStartProcesses, (avoidColdStartProcess) => {
						avoidColdStartProcess();
					});
					res.status(200).send('IM_SO_HOT');
				}
				
				else {
					
					// 암호화 되어있으면 복호화합니다.
					if (data.__ENCRYPT !== undefined) {
						data = querystring.parse(encrypt(data.__ENCRYPT));
					}
					
					f(data, () => {
						res.status(500).end();
					}, (result) => {
						if (CHECK_IS_DATA(result) === true || CHECK_IS_ARRAY(result) === true) {
							res.status(200).send(STRINGIFY(result));
						} else {
							res.status(200).send(result);
						}
					}, req.headers);
				}
			};
		}
	};
});
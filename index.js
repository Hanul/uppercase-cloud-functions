require('uppercase-core-common');

global.CLOUD_FUNCTION = METHOD((m) => {
	
	const avoidColdStartProcesses = [];
	
	// cold start 방지용 처리 추가
	m.addAvoidColdStartProcess = (process) => {
		avoidColdStartProcesses.push(process);
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
					
					f(data, () => {
						res.status(500).end();
					}, (result) => {
						if (CHECK_IS_DATA(result) === true || CHECK_IS_ARRAY(result) === true) {
							res.status(200).send(STRINGIFY(result));
						} else {
							res.status(200).send(result);
						}
					});
				}
			};
		}
	};
});
var express = require('express');
var router = express.Router();

//stress the realtime page
router.post('/:n', function(req, res){
	
	var sum = 0;
	var messageSize = req.body.sizeMultiplier / 31;
	
	

	
	console.log("bent vagyok");

	for(var i = 0;i<req.body.limit;i++) {
		var blockres = messageSize * fibonacci(parseInt(req.param('n'), 10));
		//console.log(blockres);
		sum += blockres;
	}
	
	sum *= blockres;
	console.log(sum);
	res.send("stress successful: "+sum);
	
});
 
function fibonacci(n) {
  if (n < 2)
    return 1;
  else
    return fibonacci(n-2) + fibonacci(n-1);
}
 
module.exports = router;
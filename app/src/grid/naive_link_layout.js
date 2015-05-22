/**
 * Created by Divya on 4/8/2015.
 */
color = null;

var createNaiveLinks = (function(){
    return function(linkColor, linkMatrix){
        color = linkColor;
        return createLinks(linkMatrix);
    }
})();

var createLinks = (function(){
    return function(linkMatrix){
        var links = [];
        var arcs = [];
        var  counter = 0;
        var sourceColor = 'green';
        var sourceID;

        for(var k=0; k<linkMatrix.length; k++){

            for(var i=0; i<linkMatrix[k].length; i++){
                var beg=0, end=0;

                for(var j=0; j<linkMatrix[k][i].length; j++){
                    if(linkMatrix[k][i][j].left == true){
                        beg = Math.min(i, j);
                        end = Math.max(i, j);
                        linkColor = linkMatrix[k][i][j].color;
                        sourceID = linkMatrix[k][i][j].sourceID;
                        sourceID = sourceID.replace(':', '');
                        sourceID = sourceID.replace(':', '');

                        if (i == beg){
                            leftArc = sourceColor;
                            rightArc = linkColor;
                        }
                        else{
                            leftArc = linkColor;
                            rightArc = sourceColor;
                        }


                        pos = linkPosition(k, beg, end, i, color);

                        if(color == 'green'){
                            id = "green" + counter;
                            counter += 1;

                            sourceID = 'green' + sourceID;

                            arcs.push({"center": {"x": pos.center1X, "y": pos.center1Y}, "startAngle": 270, "endAngle": 360, "color": leftArc, "id": id, 'sourceID': sourceID});
                            arcs.push({"center": {"x": pos.center2X, "y": pos.center2Y}, "startAngle": 0, "endAngle": 90, "color": rightArc, "id": id, 'sourceID': sourceID});

                            //links
                            links.push({"source":{"x":pos.sNodeX , "y": pos.sNodeY}, "target": {"x": pos.sNodeX, "y": pos.center1Y}, "color": linkColor, "id": id, 'sourceID': sourceID});
                            links.push({"source": {"x": pos.center1X, "y": pos.sNodeLinkY}, "target": {"x": pos.center2X, "y": pos.tNodeLinkY}, "color": linkColor, "id": id, 'sourceID': sourceID});
                            links.push({"source": {"x": pos.tNodeX, "y": pos.tNodeY}, "target": {"x": pos.tNodeX, "y": pos.center2Y}, "color": linkColor, "id": id, 'sourceID': sourceID});
                        }
                        else if(color == 'black'){
                            id = "black" + counter;
                            counter += 1;

                            sourceID = 'black' + sourceID;

                            arcs.push({"center": {"x": pos.center1X, "y": pos.center1Y}, "startAngle": 270, "endAngle": 360, "color": leftArc, "id": id, 'sourceID': sourceID});
                            arcs.push({"center": {"x": pos.center2X, "y": pos.center2Y}, "startAngle": 180, "endAngle": 270, "color": rightArc, "id": id, 'sourceID': sourceID});

                            //links
                            links.push({"source":{"x":pos.sNodeX , "y": pos.sNodeY}, "target": {"x": pos.center1X, "y": pos.sNodeY}, "color": linkColor, "id": id, 'sourceID': sourceID});
                            links.push({"source": {"x": pos.sNodeLinkX, "y": pos.center1Y}, "target": {"x": pos.tNodeLinkX, "y": pos.center2Y}, "color": linkColor, "id": id, 'sourceID': sourceID});
                            links.push({"source": {"x": pos.tNodeX, "y": pos.tNodeY}, "target": {"x": pos.center2X, "y": pos.tNodeY}, "color": linkColor, "id": id, 'sourceID': sourceID});
                        }
                    }
                }

            }
        }
        return {
            links: links,
            arcs: arcs
        };
    }
})();
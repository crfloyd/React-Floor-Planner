//----------------------- Quick SVG LIBRARY --------------------------------------------------
//----------------------- V1.0 Licence MIT ---------------------------------------------------
//----------------------- Author : Patrick RASPINO--------------------------------------------
//----------------------- 11/08/16 -----------------------------------------------------------

// 'use strict';

import { intersectionOfEquations, isObjectsEquals } from "./src/utils";
import {
	createEquation,
	getAngle,
	pointInPolygon,
	vertexList,
} from "./src/svgTools";

export const qSVG = {
	create: function (id, shape, attrs) {
		var shape = $(
			document.createElementNS("http://www.w3.org/2000/svg", shape)
		);
		for (var k in attrs) {
			shape.attr(k, attrs[k]);
		}
		if (id != "none") {
			$("#" + id).append(shape);
		}
		return shape;
	},

	middle: function (xo, yo, xd, yd) {
		var x1 = parseInt(xo);
		var y1 = parseInt(yo);
		var x2 = parseInt(xd);
		var y2 = parseInt(yd);
		var middleX = Math.abs(x1 + x2) / 2;
		var middleY = Math.abs(y1 + y2) / 2;
		return {
			x: middleX,
			y: middleY,
		};
	},

	triangleArea: function (fp, sp, tp) {
		var A = 0;
		var B = 0;
		var C = 0;
		var p = 0;
		A = qSVG.measure(fp, sp);
		B = qSVG.measure(sp, tp);
		C = qSVG.measure(tp, fp);
		p = (A + B + C) / 2;
		return Math.sqrt(p * (p - A) * (p - B) * (p - C));
	},

	measure: function (po, pt) {
		return Math.sqrt(Math.pow(po.x - pt.x, 2) + Math.pow(po.y - pt.y, 2));
	},

	gap: function (po, pt) {
		return Math.pow(po.x - pt.x, 2) + Math.pow(po.y - pt.y, 2);
	},

	pDistance(point, pointA, pointB) {
		var x = point.x;
		var y = point.y;
		var x1 = pointA.x;
		var y1 = pointA.y;
		var x2 = pointB.x;
		var y2 = pointB.y;
		var A = x - x1;
		var B = y - y1;
		var C = x2 - x1;
		var D = y2 - y1;
		var dot = A * C + B * D;
		var len_sq = C * C + D * D;
		var param = -1;
		if (len_sq != 0)
			//in case of 0 length line
			param = dot / len_sq;
		var xx, yy;
		if (param < 0) {
			xx = x1;
			yy = y1;
		} else if (param > 1) {
			xx = x2;
			yy = y2;
		} else {
			xx = x1 + param * C;
			yy = y1 + param * D;
		}
		var dx = x - xx;
		var dy = y - yy;
		return {
			x: xx,
			y: yy,
			distance: Math.sqrt(dx * dx + dy * dy),
		};
	},

	nearPointOnEquation: function (equation, point) {
		// Y = Ax + B ---- equation {A:val, B:val}
		var pointA = {};
		var pointB = {};
		if (equation.A == "h") {
			return {
				x: point.x,
				y: equation.B,
				distance: Math.abs(equation.B - point.y),
			};
		} else if (equation.A == "v") {
			return {
				x: equation.B,
				y: point.y,
				distance: Math.abs(equation.B - point.x),
			};
		} else {
			pointA.x = point.x;
			pointA.y = equation.A * point.x + equation.B;
			pointB.x = (point.y - equation.B) / equation.A;
			pointB.y = point.y;
			return qSVG.pDistance(point, pointA, pointB);
		}
	},

	circlePath: function (cx, cy, r) {
		return (
			"M " +
			cx +
			" " +
			cy +
			" m -" +
			r +
			", 0 a " +
			r +
			"," +
			r +
			" 0 1,0 " +
			r * 2 +
			",0 a " +
			r +
			"," +
			r +
			" 0 1,0 -" +
			r * 2 +
			",0"
		);
	},

	// perpendicularEquation: function (equation, x1, y1) {
	// 	if (typeof equation.A != "string") {
	// 		return {
	// 			A: -1 / equation.A,
	// 			B: y1 - (-1 / equation.A) * x1,
	// 		};
	// 	}
	// 	if (equation.A == "h") {
	// 		return {
	// 			A: "v",
	// 			B: x1,
	// 		};
	// 	}
	// 	if (equation.A == "v") {
	// 		return {
	// 			A: "h",
	// 			B: y1,
	// 		};
	// 	}
	// },

	angleBetweenEquations: function (m1, m2) {
		if (m1 == "h") m1 = 0;
		if (m2 == "h") m2 = 0;
		if (m1 == "v") m1 = 10000;
		if (m2 == "v") m2 = 10000;
		var angleRad = Math.atan(Math.abs((m2 - m1) / (1 + m1 * m2)));
		return (360 * angleRad) / (2 * Math.PI);
	},

	vectorXY: function (obj1, obj2) {
		return {
			x: obj2.x - obj1.x,
			y: obj2.y - obj1.y,
		};
	},

	vectorAngle: function (v1, v2) {
		return (
			(Math.atan2(v2.y - v1.y, v2.x - v1.x) + Math.PI / 2) * (180 / Math.PI)
		);
	},

	vectorDeter: function (v1, v2) {
		return v1.x * v2.y - v1.y * v2.x;
	},

	btwn: function (a, p1, p2, round = false) {
		if (round) {
			a = Math.round(a);
			p1 = Math.round(p1);
			p2 = Math.round(p2);
		}
		return (a >= p1 && a <= p2) || (a >= p2 && a <= p1);
	},

	nearPointFromPath: function (Pathsvg, point, range = Infinity) {
		var pathLength = Pathsvg.getTotalLength();
		if (pathLength > 0) {
			var precision = 40;
			var best;
			var bestLength;
			var bestDistance = Infinity;
			for (
				var scan, scanLength = 0, scanDistance;
				scanLength <= pathLength;
				scanLength += precision
			) {
				scan = Pathsvg.getPointAtLength(scanLength);
				scanDistance = qSVG.gap(scan, point);
				if (scanDistance < bestDistance) {
					(best = scan),
						(bestLength = scanLength),
						(bestDistance = scanDistance);
				}
			}
			// binary search for precise estimate
			precision /= 2;
			while (precision > 1) {
				var before,
					after,
					beforeLength,
					afterLength,
					beforeDistance,
					afterDistance;
				if (
					(beforeLength = bestLength - precision) >= 0 &&
					(beforeDistance = qSVG.gap(
						(before = Pathsvg.getPointAtLength(beforeLength)),
						point
					)) < bestDistance
				) {
					(best = before),
						(bestLength = beforeLength),
						(bestDistance = beforeDistance);
				} else if (
					(afterLength = bestLength + precision) <= pathLength &&
					(afterDistance = qSVG.gap(
						(after = Pathsvg.getPointAtLength(afterLength)),
						point
					)) < bestDistance
				) {
					(best = after),
						(bestLength = afterLength),
						(bestDistance = afterDistance);
				} else {
					precision /= 2;
				}
			}

			if (bestDistance <= range * range) {
				return {
					x: best.x,
					y: best.y,
					length: bestLength,
					distance: bestDistance,
					seg: Pathsvg.getPathSegAtLength(bestLength),
				};
			} else {
				return false;
			}
		} else {
			return false;
		}
	},

	//  ON PATH RETURN FALSE IF 0 NODE ON PATHSVG WITH POINT coords
	//  RETURN INDEX ARRAY OF NODEs onPoint
	getNodeFromPath: function (Pathsvg, point, except = [""]) {
		var nodeList = Pathsvg.getPathData();
		var k = 0;
		var nodes = [];
		var countNode = 0;
		for (var k = 0; k < nodeList.length; k++) {
			if (
				nodeList[k].values[0] == point.x &&
				nodeList[k].values[1] == point.y &&
				nodeList[k].type != "Z"
			) {
				if (except.indexOf(k) == -1) {
					countNode++;
					nodes.push(k);
				}
			}
		}
		if (countNode == 0) return false;
		else return nodes;
	},

	// RETURN ARRAY [{x,y}, {x,y}, ...] OF REAL COORDS POLYGON INTO WALLS, THICKNESS PARAM
	polygonIntoWalls: function (vertex, surface, walls) {
		var vertexArray = surface;
		var wall = [];
		var polygon = [];
		for (var rr = 0; rr < vertexArray.length; rr++) {
			polygon.push({
				x: vertex[vertexArray[rr]].x,
				y: vertex[vertexArray[rr]].y,
			});
		}
		// FIND EDGE (WALLS HERE) OF THESE TWO VERTEX
		for (var i = 0; i < vertexArray.length - 1; i++) {
			for (
				var segStart = 0;
				segStart < vertex[vertexArray[i + 1]].segment.length;
				segStart++
			) {
				for (
					var segEnd = 0;
					segEnd < vertex[vertexArray[i]].segment.length;
					segEnd++
				) {
					if (
						vertex[vertexArray[i + 1]].segment[segStart] ==
						vertex[vertexArray[i]].segment[segEnd]
					) {
						wall.push({
							x1: vertex[vertexArray[i]].x,
							y1: vertex[vertexArray[i]].y,
							x2: vertex[vertexArray[i + 1]].x,
							y2: vertex[vertexArray[i + 1]].y,
							segment: vertex[vertexArray[i + 1]].segment[segStart],
						});
					}
				}
			}
		}
		// CALC INTERSECS OF EQ PATHS OF THESE TWO WALLS.
		var inside = [];
		var outside = [];
		for (var i = 0; i < wall.length; i++) {
			var inter = [];
			var edge = wall[i];
			if (i < wall.length - 1) var nextEdge = wall[i + 1];
			else var nextEdge = wall[0];
			var angleEdge = Math.atan2(edge.y2 - edge.y1, edge.x2 - edge.x1);
			var angleNextEdge = Math.atan2(
				nextEdge.y2 - nextEdge.y1,
				nextEdge.x2 - nextEdge.x1
			);
			var edgeThicknessX =
				(walls[edge.segment].thick / 2) * Math.sin(angleEdge);
			var edgeThicknessY =
				(walls[edge.segment].thick / 2) * Math.cos(angleEdge);
			var nextEdgeThicknessX =
				(walls[nextEdge.segment].thick / 2) * Math.sin(angleNextEdge);
			var nextEdgeThicknessY =
				(walls[nextEdge.segment].thick / 2) * Math.cos(angleNextEdge);
			var eqEdgeUp = createEquation(
				edge.x1 + edgeThicknessX,
				edge.y1 - edgeThicknessY,
				edge.x2 + edgeThicknessX,
				edge.y2 - edgeThicknessY
			);
			var eqEdgeDw = createEquation(
				edge.x1 - edgeThicknessX,
				edge.y1 + edgeThicknessY,
				edge.x2 - edgeThicknessX,
				edge.y2 + edgeThicknessY
			);
			var eqNextEdgeUp = createEquation(
				nextEdge.x1 + nextEdgeThicknessX,
				nextEdge.y1 - nextEdgeThicknessY,
				nextEdge.x2 + nextEdgeThicknessX,
				nextEdge.y2 - nextEdgeThicknessY
			);
			var eqNextEdgeDw = createEquation(
				nextEdge.x1 - nextEdgeThicknessX,
				nextEdge.y1 + nextEdgeThicknessY,
				nextEdge.x2 - nextEdgeThicknessX,
				nextEdge.y2 + nextEdgeThicknessY
			);

			angleEdge = angleEdge * (180 / Math.PI);
			angleNextEdge = angleNextEdge * (180 / Math.PI);

			if (eqEdgeUp.A != eqNextEdgeUp.A) {
				inter.push(intersectionOfEquations(eqEdgeUp, eqNextEdgeUp));
				inter.push(intersectionOfEquations(eqEdgeDw, eqNextEdgeDw));
			} else {
				inter.push({
					x: edge.x2 + edgeThicknessX,
					y: edge.y2 - edgeThicknessY,
				});
				inter.push({
					x: edge.x2 - edgeThicknessX,
					y: edge.y2 + edgeThicknessY,
				});
			}

			for (var ii = 0; ii < inter.length; ii++) {
				if (pointInPolygon(inter[ii], polygon)) inside.push(inter[ii]);
				else outside.push(inter[ii]);
			}
		}
		inside.push(inside[0]);
		outside.push(outside[0]);
		return { inside: inside, outside: outside };
	},

	area: function (coordss) {
		if (coordss.length < 2) return false;
		var realArea = 0;
		var j = coordss.length - 1;
		for (var i = 0; i < coordss.length; i++) {
			realArea =
				realArea +
				(coordss[j].x + coordss[i].x) * (coordss[j].y - coordss[i].y);
			j = i;
		}
		realArea = realArea / 2;
		return Math.abs(realArea.toFixed(2));
	},

	areaRoom: function (vertex, coords, digit = 2) {
		var vertexArray = coords;
		var roughArea = 0;
		var j = vertexArray.length - 2;
		for (var i = 0; i < vertexArray.length - 1; i++) {
			roughArea =
				roughArea +
				(vertex[vertexArray[j]].x + vertex[vertexArray[i]].x) *
					(vertex[vertexArray[j]].y - vertex[vertexArray[i]].y);
			j = i;
		}
		roughArea = roughArea / 2;
		return Math.abs(roughArea.toFixed(digit));
	},

	perimeterRoom: function (coords, digit = 2) {
		var vertexArray = coords;
		var roughRoom = 0;
		for (var i = 0; i < vertexArray.length - 1; i++) {
			added = qSVG.measure(vertex[vertexArray[i]], vertex[vertexArray[i + 1]]);
			roughRoom = roughRoom + added;
		}
		return roughRoom.toFixed(digit);
	},

	// vertexList: function (junction) {
	// 	var verticies = [];
	// 	// var vertextest = [];
	// 	for (var jj = 0; jj < junction.length; jj++) {
	// 		var found = true;
	// 		for (var vv = 0; vv < verticies.length; vv++) {
	// 			if (
	// 				Math.round(junction[jj].values[0]) == Math.round(verticies[vv].x) &&
	// 				Math.round(junction[jj].values[1]) == Math.round(verticies[vv].y)
	// 			) {
	// 				found = false;
	// 				verticies[vv].segment.push(junction[jj].segment);
	// 				break;
	// 			} else {
	// 				found = true;
	// 			}
	// 		}
	// 		if (found) {
	// 			verticies.push({
	// 				x: Math.round(junction[jj].values[0]),
	// 				y: Math.round(junction[jj].values[1]),
	// 				segment: [junction[jj].segment],
	// 				bypass: 0,
	// 				type: junction[jj].type,
	// 			});
	// 		}
	// 	}

	// 	var toClean = [];
	// 	for (var ss = 0; ss < verticies.length; ss++) {
	// 		const vert = verticies[ss];
	// 		const vertChildren = [];
	// 		const vertRemoved = [];
	// 		vert.child = vertChildren;
	// 		vert.removed = vertRemoved;
	// 		for (var sg = 0; sg < vert.segment.length; sg++) {
	// 			const vertSegment = vert.segment[sg];
	// 			for (var sc = 0; sc < verticies.length; sc++) {
	// 				if (sc === ss) continue;
	// 				const vertCompare = verticies[sc];
	// 				for (var scg = 0; scg < vertCompare.segment.length; scg++) {
	// 					if (vertCompare.segment[scg] == vertSegment) {
	// 						vertChildren.push({
	// 							id: sc,
	// 							angle: Math.floor(getAngle(vert, vertCompare, "deg").deg),
	// 						});
	// 					}
	// 				}
	// 			}
	// 		}
	// 		toClean = [];
	// 		for (var fr = 0; fr < vertChildren.length - 1; fr++) {
	// 			for (var ft = fr + 1; ft < vertChildren.length; ft++) {
	// 				if (fr != ft && typeof vertChildren[fr] != "undefined") {
	// 					found = true;

	// 					if (
	// 						qSVG.btwn(
	// 							vertChildren[ft].angle,
	// 							vertChildren[fr].angle + 3,
	// 							vertChildren[fr].angle - 3,
	// 							true
	// 						) &&
	// 						found
	// 					) {
	// 						var dOne = qSVG.gap(vert, verticies[vertChildren[ft].id]);
	// 						var dTwo = qSVG.gap(vert, verticies[vertChildren[fr].id]);
	// 						if (dOne > dTwo) {
	// 							toClean.push(ft);
	// 						} else {
	// 							toClean.push(fr);
	// 						}
	// 					}
	// 				}
	// 			}
	// 		}
	// 		toClean.sort(function (a, b) {
	// 			return b - a;
	// 		});
	// 		toClean.push(-1);
	// 		for (var cc = 0; cc < toClean.length - 1; cc++) {
	// 			if (toClean[cc] > toClean[cc + 1]) {
	// 				vert.removed.push(vertChildren[toClean[cc]].id);
	// 				vertChildren.splice(toClean[cc], 1);
	// 			}
	// 		}
	// 	}
	// 	// vertexTest = vertex;
	// 	return verticies;
	// },

	//*******************************************************
	//* @arr1, arr2 = Array to compare                      *
	//* @app = add function pop() or shift() to @arr1, arr2 *
	//* False if arr1.length != arr2.length                 *
	//* False if value into arr1[] != arr2[] - no order     *
	//* *****************************************************
	arrayCompare: function (arr1, arr2, app) {
		// if (arr1.length != arr2.length) return false;
		var minus = 0;
		var start = 0;
		if (app == "pop") {
			minus = 1;
		}
		if (app == "shift") {
			start = 1;
		}
		var coordCounter = arr1.length - minus - start;
		for (var iFirst = start; iFirst < arr1.length - minus; iFirst++) {
			for (var iSecond = start; iSecond < arr2.length - minus; iSecond++) {
				if (arr1[iFirst] == arr2[iSecond]) {
					coordCounter--;
				}
			}
		}
		if (coordCounter == 0) return true;
		else return false;
	},

	vectorVertex: function (vex1, vex2, vex3) {
		var vCurr = qSVG.vectorXY(vex1, vex2);
		var vNext = qSVG.vectorXY(vex2, vex3);
		var Na = Math.sqrt(vCurr.x * vCurr.x + vCurr.y * vCurr.y);
		var Nb = Math.sqrt(vNext.x * vNext.x + vNext.y * vNext.y);
		var C = (vCurr.x * vNext.x + vCurr.y * vNext.y) / (Na * Nb);
		var S = vCurr.x * vNext.y - vCurr.y * vNext.x;
		var BAC = Math.sign(S) * Math.acos(C);
		return BAC * (180 / Math.PI);
	},

	segmentTree: function (VERTEX_NUMBER, vertex) {
		const TREELIST = [VERTEX_NUMBER];
		const WAY = [];
		let COUNT = vertex.length;
		const ORIGIN = VERTEX_NUMBER;
		tree(TREELIST, ORIGIN, COUNT);
		return WAY;

		function tree(TREELIST, ORIGIN, COUNT) {
			if (TREELIST.length == 0) return;
			var TREETEMP = [];
			COUNT--;
			for (var k = 0; k < TREELIST.length; k++) {
				var found = true;
				var WRO = TREELIST[k];
				var WRO_ARRAY = WRO.toString().split("-");
				var WR = WRO_ARRAY[WRO_ARRAY.length - 1];

				for (var v = 0; v < vertex[WR].child.length; v++) {
					if (
						vertex[WR].child[v].id == ORIGIN &&
						COUNT < vertex.length - 1 &&
						WRO_ARRAY.length > 2
					) {
						// WAYS HYPER
						WAY.push(WRO + "-" + ORIGIN); // WAYS
						found = false;
						break;
					}
				}
				if (found) {
					var bestToAdd;
					var bestDet = 0;
					var nextVertex = -1;
					// var nextVertexValue = 360;
					var nextDeterValue = Infinity;
					var nextDeterVal = 0;
					var nextFlag = 0;
					if (vertex[WR].child.length == 1) {
						if (WR == ORIGIN && COUNT == vertex.length - 1) {
							TREETEMP.push(WRO + "-" + vertex[WR].child[0].id);
						}
						if (WR != ORIGIN && COUNT < vertex.length - 1) {
							TREETEMP.push(WRO + "-" + vertex[WR].child[0].id);
						}
					} else {
						for (
							var v = 0;
							v < vertex[WR].child.length && vertex[WR].child.length > 0;
							v++
						) {
							if (WR == ORIGIN && COUNT == vertex.length - 1) {
								// TO INIT FUNCTION -> // CLOCKWISE Research
								var vDet = qSVG.vectorVertex(
									{ x: 0, y: -1 },
									vertex[WR],
									vertex[vertex[WR].child[v].id]
								);
								if (vDet >= nextDeterVal) {
									nextFlag = 1;
									nextDeterVal = vDet;
									nextVertex = vertex[WR].child[v].id;
								}
								if (Math.sign(vDet) == -1 && nextFlag == 0) {
									if (vDet < nextDeterValue && Math.sign(nextDeterValue) > -1) {
										nextDeterValue = vDet;
										nextVertex = vertex[WR].child[v].id;
									}
									if (
										vDet > nextDeterValue &&
										Math.sign(nextDeterValue) == -1
									) {
										nextDeterValue = vDet;
										nextVertex = vertex[WR].child[v].id;
									}
								}
							}
							if (
								WR != ORIGIN &&
								WRO_ARRAY[WRO_ARRAY.length - 2] != vertex[WR].child[v].id &&
								COUNT < vertex.length - 1
							) {
								// COUNTERCLOCKWISE Research
								var vDet = qSVG.vectorVertex(
									vertex[WRO_ARRAY[WRO_ARRAY.length - 2]],
									vertex[WR],
									vertex[vertex[WR].child[v].id]
								);
								if (vDet < nextDeterValue && nextFlag == 0) {
									nextDeterValue = vDet;
									nextVertex = vertex[WR].child[v].id;
								}
								if (Math.sign(vDet) == -1) {
									nextFlag = 1;
									if (vDet <= nextDeterValue) {
										nextDeterValue = vDet;
										nextVertex = vertex[WR].child[v].id;
									}
								}
							}
						}
						if (nextVertex != -1) TREETEMP.push(WRO + "-" + nextVertex);
					}
				}
			}
			if (COUNT > 0) tree(TREETEMP, ORIGIN, COUNT);
		}
	},

	diffArray: function (arr1, arr2) {
		return arr1.concat(arr2).filter(function (val) {
			if (!(arr1.includes(val) && arr2.includes(val))) return val;
		});
	},

	diffObjIntoArray: function (arr1, arr2) {
		var count = 0;
		for (var k = 0; k < arr1.length - 1; k++) {
			for (var n = 0; n < arr2.length - 1; n++) {
				if (isObjectsEquals(arr1[k], arr2[n])) {
					count++;
				}
			}
		}
		var waiting = arr1.length - 1;
		if (waiting < arr2.length - 1) waiting = arr2.length;
		return waiting - count;
	},

	//polygon = [{x1,y1}, {x2,y2}, ...]
	polygonVisualCenter: function (room, roomMeta) {
		var polygon = room.coords;
		var insideArray = room.inside;
		var sample = 80;
		var grid = [];
		//BOUNDING BOX OF POLYGON
		var minX, minY, maxX, maxY;
		for (var i = 0; i < polygon.length; i++) {
			var p = polygon[i];
			if (!i || p.x < minX) minX = p.x;
			if (!i || p.y < minY) minY = p.y;
			if (!i || p.x > maxX) maxX = p.x;
			if (!i || p.y > maxY) maxY = p.y;
		}
		var width = maxX - minX;
		var height = maxY - minY;
		//INIT GRID
		var sampleWidth = Math.floor(width / sample);
		var sampleHeight = Math.floor(height / sample);
		for (var hh = 0; hh < sample; hh++) {
			for (var ww = 0; ww < sample; ww++) {
				var posX = minX + ww * sampleWidth;
				var posY = minY + hh * sampleHeight;
				if (pointInPolygon({ x: posX, y: posY }, polygon)) {
					var found = true;
					for (var ii = 0; ii < insideArray.length; ii++) {
						if (
							pointInPolygon(
								{ x: posX, y: posY },
								roomMeta[insideArray[ii]].coordsOutside
							)
						) {
							found = false;
							break;
						}
					}
					if (found) {
						grid.push({ x: posX, y: posY });
					}
				}
			}
		}
		var bestRange = 0;
		var bestMatrix;

		for (var matrix = 0; matrix < grid.length; matrix++) {
			var minDistance = Infinity;
			for (var pp = 0; pp < polygon.length - 1; pp++) {
				var scanDistance = qSVG.pDistance(
					grid[matrix],
					polygon[pp],
					polygon[pp + 1]
				);
				if (scanDistance.distance < minDistance) {
					minDistance = scanDistance.distance;
				}
			}
			if (minDistance > bestRange) {
				bestMatrix = matrix;
				bestRange = minDistance;
			}
		}
		return grid[bestMatrix];
	},

	textOnDiv: function (label, pos, styled, div) {
		if (typeof pos != "undefined") {
			var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
			text.setAttributeNS(null, "x", pos.x);
			text.setAttributeNS(null, "y", pos.y);
			text.setAttribute(
				"style",
				"fill:" +
					styled.color +
					";font-weight:" +
					styled.fontWeight +
					";font-size:" +
					styled.fontSize
			);
			text.setAttributeNS(null, "text-anchor", "middle");
			text.textContent = label;
			document.getElementById(div).appendChild(text);
		}
	},
};

//----------------------- END Quick SVG LIBRARY --------------------------------------------------s

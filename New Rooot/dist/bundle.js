System.register("models/SpanningTree/spanningTreeLink", [], function (exports_1, context_1) {
    "use strict";
    var SpanningTreeLink;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [],
        execute: function () {
            SpanningTreeLink = /** @class */ (function () {
                function SpanningTreeLink(toNode, cost) {
                    this.toNode = toNode;
                    this.cost = cost;
                }
                return SpanningTreeLink;
            }());
            exports_1("SpanningTreeLink", SpanningTreeLink);
        }
    };
});
System.register("models/SpanningTree/spanningTreeNode", [], function (exports_2, context_2) {
    "use strict";
    var SpanningTreeNode;
    var __moduleName = context_2 && context_2.id;
    return {
        setters: [],
        execute: function () {
            SpanningTreeNode = /** @class */ (function () {
                function SpanningTreeNode(name, value, links) {
                    this.name = name;
                    this.value = value;
                    this.links = links;
                }
                return SpanningTreeNode;
            }());
            exports_2("SpanningTreeNode", SpanningTreeNode);
        }
    };
});
System.register("parser/graphParser", ["models/SpanningTree/spanningTreeLink", "models/SpanningTree/spanningTreeNode"], function (exports_3, context_3) {
    "use strict";
    var spanningTreeLink_1, spanningTreeNode_1, parse;
    var __moduleName = context_3 && context_3.id;
    return {
        setters: [
            function (spanningTreeLink_1_1) {
                spanningTreeLink_1 = spanningTreeLink_1_1;
            },
            function (spanningTreeNode_1_1) {
                spanningTreeNode_1 = spanningTreeNode_1_1;
            }
        ],
        execute: function () {
            exports_3("parse", parse = function (input) {
                var tempLinks = [];
                var nodes = [];
                var graphName = input.match(/(?<=Graph[ ])(\S+)/g)[0];
                var nodeMatches = input.match(/[^\s]+(?= =)|(?<== )[1-9]*/g);
                var linkMatches = input.match(/[^\s]+(?= -)|[^\s]+(?= :)|(?<=: )[0-9]*/g);
                for (var i = 0; i < linkMatches.length; i = i + 3) {
                    tempLinks.push({
                        nodes: [linkMatches[i], linkMatches[i + 1]],
                        cost: +linkMatches[i + 2] // some little trick to cast a string to number +'4' === 4
                    });
                }
                var _loop_1 = function (i) {
                    var name_1 = nodeMatches[i];
                    var value = +nodeMatches[i + 1];
                    var links = tempLinks.filter(function (l) { return l.nodes.findIndex(function (n) { return n === name_1; }) !== -1; })
                        .map(function (link) { return new spanningTreeLink_1.SpanningTreeLink(link.nodes.find(function (n) { return n !== name_1; }), link.cost); });
                    nodes.push(new spanningTreeNode_1.SpanningTreeNode(name_1, value, links));
                };
                for (var i = 0; i < nodeMatches.length; i = i + 2) {
                    _loop_1(i);
                }
                return {
                    graphName: graphName,
                    nodes: nodes
                };
            });
        }
    };
});
System.register("models/Simulation/SimulationLink", [], function (exports_4, context_4) {
    "use strict";
    var SimulationLink;
    var __moduleName = context_4 && context_4.id;
    return {
        setters: [],
        execute: function () {
            SimulationLink = /** @class */ (function () {
                function SimulationLink(nodes, cost) {
                    this.nodes = nodes;
                    this.cost = cost;
                }
                return SimulationLink;
            }());
            exports_4("SimulationLink", SimulationLink);
        }
    };
});
System.register("models/SpanningTree/minimalSpanningTree", ["models/Simulation/SimulationLink"], function (exports_5, context_5) {
    "use strict";
    var SimulationLink_1, MinimalSpanTree;
    var __moduleName = context_5 && context_5.id;
    return {
        setters: [
            function (SimulationLink_1_1) {
                SimulationLink_1 = SimulationLink_1_1;
            }
        ],
        execute: function () {
            MinimalSpanTree = /** @class */ (function () {
                function MinimalSpanTree(spanTreeLinks) {
                    this.shortestLinks = [];
                    this.allNodes = [];
                    var links = spanTreeLinks.slice();
                    links = links.sort(function (a, b) { return a.cost - b.cost; }).reverse();
                    var array = links.flatMap(function (l) { return l.nodes; });
                    var map = new Map();
                    for (var _i = 0, array_1 = array; _i < array_1.length; _i++) {
                        var item = array_1[_i];
                        if (!map.has(item.name)) {
                            map.set(item.name, true);
                            this.allNodes.push(item);
                        }
                    }
                    this.root = this.allNodes.sort(function (a, b) { return a.value - b.value; })[0];
                    while (!this.allNodesAreConnected(this.allNodes)) {
                        this.shortestLinks.push(links.pop());
                    }
                    if (this.shortestLinks.length < 5) {
                        debugger;
                    }
                }
                MinimalSpanTree.prototype.getNextNodeWhenGoing = function (from, to) {
                    var nextStep = this.getNextStep(from, to);
                    return nextStep;
                };
                MinimalSpanTree.prototype.getNextStep = function (from, to, possibleRet, lastFrom) {
                    if (from.name === to.name) {
                        return possibleRet;
                    }
                    var nodes = this.shortestLinks.filter(function (l) { return l.nodes.findIndex(function (n) { return n.name === from.name; }) !== -1; })
                        .map(function (siblingLink) { return siblingLink.nodes.find(function (n) { return n.name !== from.name; }); }).filter(function (n) { return !lastFrom ? true : n.name !== lastFrom; });
                    for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
                        var node = nodes_1[_i];
                        var ret = void 0;
                        if (!possibleRet) {
                            ret = this.getNextStep(node, to, node, from);
                        }
                        else {
                            ret = this.getNextStep(node, to, possibleRet, from);
                        }
                        if (!!ret) {
                            return ret;
                        }
                    }
                };
                MinimalSpanTree.prototype.allNodesAreConnected = function (allNodes) {
                    var result = [];
                    var array = this.shortestLinks.flatMap(function (l) { return l.nodes; });
                    var map = new Map();
                    for (var _i = 0, array_2 = array; _i < array_2.length; _i++) {
                        var item = array_2[_i];
                        if (!map.has(item.name)) {
                            map.set(item.name, true);
                            result.push(name);
                        }
                    }
                    var allNodesAreIncluded = result.length === allNodes.length;
                    var allNodesAreConnected = true;
                    if (allNodesAreIncluded)
                        for (var _a = 0, _b = this.allNodes; _a < _b.length; _a++) {
                            var item = _b[_a];
                            if (item.name !== this.root.name) {
                                if (!this.getNextNodeWhenGoing(this.root, name)) {
                                    allNodesAreConnected = false;
                                    break;
                                }
                            }
                        }
                    return allNodesAreIncluded && allNodesAreConnected;
                };
                ;
                MinimalSpanTree.prototype.linkToString = function () {
                    var sorted = this.shortestLinks.map(function (link) {
                        return new SimulationLink_1.SimulationLink(link.nodes.sort(function (a, b) {
                            if (a.name < b.name) {
                                return -1;
                            }
                            if (a.name > b.name) {
                                return 1;
                            }
                            return 0;
                        }), link.cost);
                    }).sort(function (a, b) {
                        if (a.nodes[0].name < b.nodes[0].name) {
                            return -1;
                        }
                        if (a.nodes[0].name > b.nodes[0].name) {
                            return 1;
                        }
                        return 0;
                    });
                    var ret = "";
                    sorted.forEach(function (link) {
                        ret += link.nodes[0].name + " - " + link.nodes[1].name + ";\n\t";
                    });
                    return ret;
                };
                return MinimalSpanTree;
            }());
            exports_5("MinimalSpanTree", MinimalSpanTree);
        }
    };
});
System.register("parser/mstStringify", [], function (exports_6, context_6) {
    "use strict";
    var stringify;
    var __moduleName = context_6 && context_6.id;
    return {
        setters: [],
        execute: function () {
            exports_6("stringify", stringify = function (minimalSpanTree, name) { return "\nSpanning-Tree of " + name + " {\n\tRoot: " + minimalSpanTree.root.name + ";\n\t" + minimalSpanTree.linkToString() + "\n}"; });
        }
    };
});
System.register("parser/index", ["parser/graphParser", "parser/mstStringify"], function (exports_7, context_7) {
    "use strict";
    var graphParser_1, mstStringify_1;
    var __moduleName = context_7 && context_7.id;
    return {
        setters: [
            function (graphParser_1_1) {
                graphParser_1 = graphParser_1_1;
            },
            function (mstStringify_1_1) {
                mstStringify_1 = mstStringify_1_1;
            }
        ],
        execute: function () {
            exports_7("parse", graphParser_1.parse);
            exports_7("stringify", mstStringify_1.stringify);
        }
    };
});
System.register("models/Simulation/SimulationPackage", [], function (exports_8, context_8) {
    "use strict";
    var __moduleName = context_8 && context_8.id;
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("models/Simulation/SimulationConnection", ["rxjs"], function (exports_9, context_9) {
    "use strict";
    var rxjs_1, SimulationConnection;
    var __moduleName = context_9 && context_9.id;
    return {
        setters: [
            function (rxjs_1_1) {
                rxjs_1 = rxjs_1_1;
            }
        ],
        execute: function () {
            SimulationConnection = /** @class */ (function () {
                function SimulationConnection(siblingBridges) {
                    this.send = new rxjs_1.Subject();
                    this.receive = new rxjs_1.Subject();
                    this.ping = new Promise(function (resolve) { return resolve(siblingBridges); });
                }
                return SimulationConnection;
            }());
            exports_9("SimulationConnection", SimulationConnection);
        }
    };
});
System.register("models/Simulation/Bridge", [], function (exports_10, context_10) {
    "use strict";
    var Bridge;
    var __moduleName = context_10 && context_10.id;
    return {
        setters: [],
        execute: function () {
            Bridge = /** @class */ (function () {
                function Bridge(name, value, connection) {
                    this.name = name;
                    this.value = value;
                    this.connection = connection;
                    this.connection.receive.subscribe(this.receive);
                }
                Bridge.prototype.receive = function (pkg) {
                };
                Bridge.prototype.send = function (pkg) {
                    this.connection.send.next(pkg);
                };
                return Bridge;
            }());
            exports_10("Bridge", Bridge);
        }
    };
});
System.register("models/Simulation/Simulation", ["models/Simulation/Bridge", "models/Simulation/SimulationConnection"], function (exports_11, context_11) {
    "use strict";
    var Bridge_1, SimulationConnection_1, Simulation;
    var __moduleName = context_11 && context_11.id;
    return {
        setters: [
            function (Bridge_1_1) {
                Bridge_1 = Bridge_1_1;
            },
            function (SimulationConnection_1_1) {
                SimulationConnection_1 = SimulationConnection_1_1;
            }
        ],
        execute: function () {
            Simulation = /** @class */ (function () {
                function Simulation(nodes) {
                    var _this = this;
                    this.nodes = nodes;
                    nodes.forEach(function (node) {
                        var siblingNodes = node.links.map(function (l) { return l.toNode; });
                        var conn = new SimulationConnection_1.SimulationConnection(siblingNodes);
                        _this.bridges.push(new Bridge_1.Bridge(node.name, node.value, conn));
                    });
                    // allow communication between direct connected bridges
                    this.bridges.forEach(function (bridge) {
                        var siblingNodes = nodes.find(function (n) { return n.name === bridge.name; }).links.map(function (l) { return l.toNode; });
                        bridge.connection.send.subscribe(function (pkg) {
                            if (siblingNodes.findIndex(function (n) { return n === pkg.target; })) {
                                _this.bridges.find(function (b) { return b.name === pkg.target; }).connection.receive.next(pkg);
                            }
                        });
                    });
                }
                return Simulation;
            }());
            exports_11("Simulation", Simulation);
        }
    };
});
System.register("main", ["parser/index", "models/Simulation/Simulation"], function (exports_12, context_12) {
    "use strict";
    var parser_1, Simulation_1, inputArea, outputArea, simulationButton, onSimulationClick, test;
    var __moduleName = context_12 && context_12.id;
    return {
        setters: [
            function (parser_1_1) {
                parser_1 = parser_1_1;
            },
            function (Simulation_1_1) {
                Simulation_1 = Simulation_1_1;
            }
        ],
        execute: function () {
            inputArea = document.getElementById('textIn');
            outputArea = document.getElementById('textOut');
            simulationButton = document.getElementById('simulation_btn');
            // click impl
            onSimulationClick = function () {
                var parseResult = parser_1.parse(inputArea.value);
                var simulation = new Simulation_1.Simulation(parseResult.nodes);
                console.log(simulation);
            };
            // call click impl on simulationButton click
            simulationButton.addEventListener('click', onSimulationClick);
            test = "\nGraph mygraph {\n\t// Node\n\tA = 5;\n\tB = 1;\n\tC = 3;\n\tD = 7;\n\tE = 6;\n\tF = 4;\n\t\n\t// Links und zugeh. Kosten\n\tA - B : 10;\n\tA - C : 10;\n\tB - D : 15;\n\tB - E : 10;\n\tC - D : 3;\n\tC - E : 10;\n\tD - E : 2;\n\tD - F : 10;\n\tE - F : 2;\n}";
            inputArea.value = test;
        }
    };
});

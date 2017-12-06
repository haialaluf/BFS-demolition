'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', ['myApp'])

    .controller('mainControler', ['$scope', '$q', function ($scope, $q) {

        //init the board
        //end/start stage
        $scope.state = false;
        $scope.size = 12;
        $scope.speed = 100;
        $scope.colorA = 'blue';
        $scope.colorB = 'yellow';
        $scope.colorC = 'green';

        $scope.reset = function () {
            var size = Array($scope.size + 1).join('.');
            $scope.board = size.split('').map(
                function (line, i) {
                    return size.split('').map(
                        function (tile, j) {
                            return {state: true, y: i, x: j}
                        })
                });
        };

        $scope.reset();

        $scope.calcHeight = function () {
            return 1 / $scope.board.length * 100 + '%'
        };

        $scope.mark = function (currentState) {
            if (!$scope.state && currentState.state != 'end' && currentState.state != 'start') {
                currentState.state = !currentState.state;
            } else {
                var i = 0, j, line, tile;
                if ($scope.state === 'start') {
                    //delete last start
                    for (i in $scope.board) {
                        line = $scope.board[i];
                        for (j = 0; j < line.length; j++) {
                            tile = line[j];
                            tile.state = (tile.state === 'start') ? true : tile.state;
                        }
                    }
                    currentState.state = 'start';
                    $scope.start = currentState;
                }
                else if ($scope.state === 'end') {
                    //delete last end
                    for (i in $scope.board) {
                        line = $scope.board[i];
                        for (j = 0; j < line.length; j++) {
                            tile = line[j];
                            tile.state = (tile.state === 'end') ? true : tile.state;
                        }
                    }
                    currentState.state = 'end';
                }
            }
        };

        $scope.go = function () {

            var timer = Date.now();
            var counter = 0;
            var start = $scope.start;
            $scope.path = null;
            $scope.board.forEach(function (line) {
                line.forEach(function (tile) {
                    tile.state = tile.state === 3 ? true : tile.state;
                    tile.visited = false;
                })
            });
            start.visited = true;
            helper(start, [start]).then(function (err) {
                alert('No path found');
            }, function () {
                var time = Date.now() - timer;
            });


            function helper(position, path) {
                var deferred = $q.defer();
                var p = position;
                if (position.state === 'end') {
                    //path has been found
                    $scope.path = path;
                    deferred.reject(path)
                } else {
                    if (position.state !== 'start') {
                        position.state = 3;
                    }
                    setTimeout(function () {
                        if ($scope.path) {
                            //path has been found
                            return deferred.resolve(position);
                        }
                        //path has not been found
                        counter++;
                        var possibilities = [];
                        var rightPath, right = $scope.board[position.y] && $scope.board[position.y][position.x + 1];
                        if (right && right.state && !right.visited) {
                            right.visited = true;
                            rightPath = path.concat(right);
                            possibilities.push(helper(right, rightPath));
                        }
                        var leftPath, left = $scope.board[position.y] && $scope.board[position.y][position.x - 1];
                        if (left && left.state && !left.visited) {
                            left.visited = true;
                            leftPath = path.concat(left);
                            possibilities.push(helper(left, leftPath));
                        }
                        var upPath, up = $scope.board[position.y - 1] && $scope.board[position.y - 1][position.x];
                        if (up && up.state && !up.visited) {
                            up.visited = true;
                            upPath = path.concat(up);
                            possibilities.push(helper(up, upPath));
                        }
                        var downPath, down = $scope.board[position.y + 1] && $scope.board[position.y + 1][position.x];
                        if (down && down.state && !down.visited) {
                            down.visited = true;
                            downPath = path.concat(down);
                            possibilities.push(helper(down, downPath));
                        }
                        if (possibilities.length) {
                            $q.all(possibilities).then(function (tiles) {
                                //catch all neighbor dead end tiles and unColor them
                                tiles.forEach(function (tile) {
                                    tile.state = true;
                                });
                                // resolve tile with dead end
                                deferred.resolve(position)
                            }, function (path) {
                                //some path has been found!
                                //unColor neighbor tile if they are not in path
                                [up, down, left, right].forEach(function (tile) {
                                    if (tile && tile.state && path.indexOf(tile) === -1) {
                                        tile.state = true;
                                    }
                                });
                                //reject the path to ancestors
                                deferred.reject(path);
                            });
                        } else {
                            // resolve tile with dead end
                            deferred.resolve(position);
                        }
                    }, $scope.speed);
                }
                return deferred.promise
            }
        };


    }])

    .filter('paint', function () {

        return function (tile, colorA, colorB, colorC) {
            switch (tile.state) {
                case 'start':
                    return 'white';
                case 'end':
                    return 'white';
                case false:
                    return colorB;
                case 3:
                    return colorC;
                default:
                    return colorA
            }
        }
    });
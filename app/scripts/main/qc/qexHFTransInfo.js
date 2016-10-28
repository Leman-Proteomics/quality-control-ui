/**
 * Created by qjolliet on 25/07/16.
 */
'use strict';
angular.module('qexHFTransInfo', ['thirdparties', 'environment'])

/**
 * @ngdoc service
 * @name service:eliteMonitorInfoService
 * @description
 * Access to eliteMonitorInfo
 *
 */
  .service('QexHFTransInfoService', function (httpProxy) {

    var QexHFTransInfoService = function () {
      return this;
    };

    /**
     * @ngdoc method
     * @name matches.service:QexHFTransInfoService
     * @methodOf service:QexHFTransInfoService
     * @description get the list of all elite monitor infomation
     * @returns {httpPromise} of an array of string
     */

    QexHFTransInfoService.prototype.list = function () {

      return httpProxy.get('/qc/qexHFTransInfo');
    };
    QexHFTransInfoService.prototype.addQexTransInfo = function (qexTransInfo) {

      return httpProxy.post('/qc/qexHFTransInfo', qexTransInfo,{headers: {'Content-Type': undefined}});
    };

    QexHFTransInfoService.prototype.find = function (transDate) {

      return httpProxy.get('/qc/qexHFTransInfo' + '/'+ transDate);
    };

    QexHFTransInfoService.prototype.findAllBtw2Date = function (transDate1,transDate2) {

      return httpProxy.get('/qc/qexHFTransInfo' + '/'+ transDate1 + '/'+transDate2);
    };

    QexHFTransInfoService.prototype.delete = function (transDate,transIndex) {

      return httpProxy.delete('/qc/qexHFTransInfo' + '/'+ transDate + '/' + transIndex);
    };

    QexHFTransInfoService.prototype.updateQexTransInfo = function (qexTransInfo) {

      return httpProxy.put('/qc/qexHFTransInfo', qexTransInfo, {headers: {'Content-Type': undefined}});
    };

    return new QexHFTransInfoService();

  })
  .controller('QexHFTransInfoCtrl', function($scope,$route,$window, QexHFTransInfoService,QcSummaryService,QcDevInfoService) {

    $scope.showDiv='list';
    $scope.title='QexHF Transmission Infomation';

    $scope.reDate = /^[0-9]{8}$/;
    $scope.reNumber = /\d*\.?\d+/;


    QexHFTransInfoService.list().then(function(data){
      $scope.qexTransInfos = data;

    });


    $scope.delQexTransInfo=function(transDate,transIndex){
      QexHFTransInfoService.delete(transDate, transIndex).success(function () {
        var status = 'Qex Transmission Infomation on \'' + transDate + '\' : \'' + transIndex + '\' was deleted successfully';
        console.log('delete messege=' + status);

        //$window.alert(status);
        $route.reload();
      }).error(function (error) {
        console.log('failed=', error);
      });

    };

    $scope.addQexTransInfo=function(transDate,TransResult,comment) {

      if (transDate!== undefined && TransResult !== undefined ) {
        if(comment === undefined){ comment = '';}
        QexHFTransInfoService.find(transDate).then(function (data) {
          console.log('existList=', data);
          //var existList = data;
          var transIndex;
          if (data.length === 0) {
            transIndex = '1';
          } else {
            var maxTransIndex = _.max(_.map(data,function(d){return d.transIndex;}));
            transIndex = (parseInt(maxTransIndex) + 1).toString();
            console.log('transIndex=',transIndex);
          }

          var qexTransInfo = {
            'transDate': transDate,
            'transIndex': transIndex,
            'TransResult': TransResult,
            'Comment': comment
          };
          //console.log('eiliteMonitorInfo=', eiliteMonitorInfo);

          QexHFTransInfoService.addQexTransInfo(qexTransInfo).success(function (resp) {
            console.log('add qex transmission Info successfully=', resp);
            $route.reload();

          }).error(function (error) {
            console.log('add qex transmission Info failed=', error);
          });


        });

      }
    };

    $scope.showChart = function(dateFrom,dateTo) {
      $scope.showDiv= 'chart';
      $scope.figLen= window.outerWidth*0.45;

      if (dateFrom===undefined || dateFrom===''){

        QexHFTransInfoService.list().then(function(data){
          console.log('dateFrom=' + dateFrom);
          //console.log('data=' +  data.length);
          var qexHFData= _.map(data, function (s) {
            return {
              date: s.transDate +'_' +  s.transIndex,
              val1: s.TransResult,
              comment: s.Comment
            };
          });
          $scope.qexData=qexHFData;

        });

        QcSummaryService.list().then(function(data) {

          var summaries = _.filter(data, function (o) {
            return (o.rawfileInfomation.machineName === 'QexHF' && o.selFlg === true);
          });

          $scope.pepseqidfScatData = _.map(summaries, function (s) {
            return {
              rawfileName: s.rawfileInfomation.proteinName + '_' + s.rawfileInfomation.pQuantity + '_' + s.rawfileInfomation.machineName +
              '_' + s.rawfileInfomation.columnType + '_' + s.rawfileInfomation.Date + '_' + s.rawfileInfomation.Index,
              date: s.rawfileInfomation.Date,
              val: s.PeptideSeq
            };
          });

          var groupSummary = _.groupBy(summaries, function (value) {
            return value.rawfileInfomation.Date;
          });

          //Get average value array per day
          $scope.pepseqidfLineData = _.map(groupSummary, function (g) {
            return {
              date: g[0].rawfileInfomation.Date,
              avg: _.reduce(_.pluck(g, 'PeptideSeq'), function (memo, num) {
                return memo + num;
              }, 0) / (_.pluck(g, 'PeptideSeq').length === 0 ? 1 : _.pluck(g, 'PeptideSeq').length)
            };
          });
        });

        QcDevInfoService.list().then(function(dev){
          $scope.devInfos = dev;

          //$window.location.href= '#/eliteMonitorInfo/chart';
        });

      }else{

        QexHFTransInfoService.findAllBtw2Date(dateFrom, dateTo).then(function (data) {
          console.log('dateFrom=' + dateFrom);
          var qexHFData= _.map(data, function (s) {
            return {
              date: s.transDate +'_' +  s.transIndex,
              val1: s.TransResult,
              comment: s.Comment
            };
          });

          $scope.qexData = qexHFData;

        });

        var dateFromForQc = dateFrom.slice(2);
        var dateToForQc = dateTo.slice(2);

        QcSummaryService.findAllBtw2Date(dateFromForQc,dateToForQc).then(function(data){
          var summaries = _.filter(data,function(o){
            return (o.rawfileInfomation.machineName ==='QexHF' && o.selFlg === true);
          });

          $scope.pepseqidfScatData = _.map(summaries, function (s) {
            return {
              rawfileName: s.rawfileInfomation.proteinName + '_' + s.rawfileInfomation.pQuantity + '_' + s.rawfileInfomation.machineName +
              '_' + s.rawfileInfomation.columnType + '_' + s.rawfileInfomation.Date + '_' + s.rawfileInfomation.Index,
              date: s.rawfileInfomation.Date,
              val: s.PeptideSeq
            };
          });

          var groupSummary = _.groupBy(summaries, function (value) {
            return value.rawfileInfomation.Date;
          });

          //Get average value array per day
          $scope.pepseqidfLineData = _.map(groupSummary, function (g) {
            return {
              date: g[0].rawfileInfomation.Date,
              avg: _.reduce(_.pluck(g, 'PeptideSeq'), function (memo, num) {
                return memo + num;
              }, 0) / (_.pluck(g, 'PeptideSeq').length === 0 ? 1 : _.pluck(g, 'PeptideSeq').length)
            };
          });

        });

        QcDevInfoService.findDevInfoBtw2Date(dateFromForQc,dateToForQc).then(function(dev){

          $scope.devInfos = dev;

        });
      }

    };
    $scope.$back = function() {
      $scope.showDiv='list';
      $window.location.href= '#/qexHFTransInfo';
    };

  })
  .directive('qexhfChart',function(d3) {
    return {
      restrict: 'E',
      template: '<svg width="1100" height="600"></svg>',
      link: function (scope, elem) {

        var qexData;
        var figLen = scope.figLen;
        scope.$watch('qexData', function (value) {
          if (value) {

            qexData = value;

            var rawSvg = elem.find('svg');
            //var svg = d3.select(rawSvg[0]);

            //Define the margin,width,height
            var margin = {top: 30, right: 150, bottom: 70, left: 80},
              width = figLen - margin.left - margin.right,
              height = 600 - margin.top - margin.bottom;

            // Set the ranges x


            var x = d3.scale.ordinal();
            var domainX = qexData.map(function (d) {
              return d.date;
            });

            x.domain(_.sortBy(domainX, function (num) {
              return num;
            }))
              .rangePoints([0, width]);
            //.domain(d3.range(qexData.length))
            //.rangeRoundBands([0, width], 0.05);

            // Define the axes
            var xAxis = d3.svg.axis()
              .scale(x)
              .tickFormat(function (d) {
                return d.slice(0, 8);
              })
              .orient('bottom');

            // Scale the range of the data Y
            var y = d3.scale.linear().range([height, 0]);

            y.domain([d3.min(qexData, function (d) {
              return d.val1;
            }) * 0.9, d3.max(qexData, function (d) {
              return d.val1;
            }) * 1.1]);
            console.log('max val ' + d3.max(qexData, function (d) {
                return d.val1;
              }));
            var yAxis = d3.svg.axis().scale(y)
              .orient('left')
              .tickFormat(function (d) {
                return d * 100 + '%';
              })
              .ticks(7);

            //var svg = d3.select('body').append('svg')
            // Create SVG element
            var svg = d3.select(rawSvg[0])
              .attr('width', width + margin.left + margin.right)
              .attr('height', height + margin.top + margin.bottom)
              .append('g')
              .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            // add the tooltip area to the webpage
            var tooltip = d3.select('body').append('div')
              .attr('class', 'tooltip')
              .style('opacity', 0);

            var color = d3.scale.ordinal()
              .range(['blue', 'red']);
            color.domain(d3.keys(qexData[0]).filter(function (key) {
              return key !== 'date' && key !== 'comment';
            }));
            console.log('color domain' + color.domain().slice());

            // Define lines
            var line1 = d3.svg.line()
              .x(function (d) {
                return x(d.date);
              })
              .y(function (d) {
                return y(d.val1);
              });

            var pathContainers = svg.selectAll('g.line')
              .data(qexData);

            pathContainers.enter().append('g')
              .attr('class', 'line');

            pathContainers.selectAll('path')
              .data(function (d) {
                return [d];
              }) // continues the data from the pathContainer
              .enter().append('path')
              .attr('d', line1(qexData))
              .attr('fill', 'none')
              .attr('stroke', 'blue');

            pathContainers.selectAll('.dot')
              .data(qexData)
              .enter().append('circle')
              .attr('class', 'dot')
              .attr('r', 4)
              .attr('cx', function (d) {
                return x(d.date);
              })
              .attr('cy', function (d) {
                return y(d.val1);
              })
              .attr('fill', 'orange')
              .on('mouseover', function (d) {
                tooltip.transition()
                  .duration(200)
                  .style('opacity', 0.8);
                tooltip.html('<table><tr><td style="font-weight: bold;text-underline;" >' + d.date.slice(0, 8) + '</td></tr><tr><td>#Transmission Result' + ': ' + d.val1 * 100 + '%</td></tr></table>')
                  .style('left', (d3.event.pageX + 5) + 'px')
                  .style('top', (d3.event.pageY - 28) + 'px');

              })
              .on('mouseout', function () {
                tooltip.transition()
                  .duration(500)
                  .style('opacity', 0);
              });

            // Add the X Axis
            svg.append('g')
              .attr('class', 'x axis')
              .attr('transform', 'translate(0,' + height + ')')
              .call(xAxis)

              .selectAll('text')

              .style('text-anchor', 'end')

              .attr('dx', '-.10em')

              .attr('dy', '.15em')

              .attr('transform', function () {

                return 'rotate(-30)';

              });

            // Add the Y Axis
            svg.append('g')
              .attr('class', 'y axis')
              .call(yAxis);

            //set X axis label
            svg.append('text')
              //.attr('class', 'label')
              .attr('x', width / 2)
              .attr('y', height + margin.bottom)
              //.attr('dx', '1em')
              //.style("font-size", "16px")
              .style('text-anchor', 'middle')
              .text('Dates');

            //set Y axis label
            svg.append('text')
              .attr('transform', 'rotate(-90)')
              .attr('y', 0 - margin.left)
              .attr('x', 0 - (height / 2))
              .attr('dy', '1em')
              .style('text-anchor', 'middle')
              .text('Values');

            // add legend
            var legend = svg.selectAll('.legend')
              .data(color.domain().slice().reverse())
              .enter().append('g')
              .attr('class', 'legend')
              .attr('transform', function (d, i) {
                return 'translate(0,' + i * 20 + ')';
              });

            legend.append('rect')
              .attr('x', width + 10)
              .attr('y', 25)
              .attr('width', 10)
              .attr('height', 10)
              .style('fill', color);

            legend.append('text')
              .attr('x', width + 25)
              .attr('y', 33)
              .attr('height', 30)
              .attr('width', 100)
              .text('Transmission Result');

            _.map(qexData, function (d) {

              if (d.comment !== '' && d.comment !== undefined) {
                svg.append('line')          // attach a line
                  .style('stroke', 'green')  // colour the line
                  .attr('stroke-width', 2)
                  .attr('x1', x(d.date))     // x position of the first end of the line
                  .attr('y1', 0)            // y position of the first end of the line
                  .attr('x2', x(d.date))        // x position of the second end of the line
                  .attr('y2', height)
                  .on('mouseover', function () {
                    tooltip.transition()
                      .duration(200)
                      .style('opacity', 1.0);
                    tooltip.html('Qex Tranmission Infomation:<br>' + d.comment)
                      .style('left', (d3.event.pageX) + 'px')
                      .style('top', (d3.event.pageY - 30) + 'px')
                    ;
                  })
                  .on('mouseout', function () {
                    tooltip.transition()
                      .duration(500)
                      .style('opacity', 0);
                  });

              }

            });

          }
        });
      }
    };
  });


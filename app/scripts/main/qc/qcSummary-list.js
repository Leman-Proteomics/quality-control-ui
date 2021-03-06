'use strict';
angular.module('qcSummary-list', ['thirdparties', 'environment','checklist-model'])
/**
 * @ngdoc service
 * @name service:qcSummaryService
 * @description
 * Access to qcSummary
 *
 */
/**
 * custom filter
 */
  //.filter('summarySelection', ['filterFilter', function (filterFilter) {
  //  return function summarySelection(input, prop) {
  //    return filterFilter(input, { selFlg: true }).map(function (summary) {
  //      console.log('filter=' + summary[prop] );
  //      return summary[prop]; });
  //  };
  //}])
  .service('QcSummaryService', function (httpProxy) {

    var QcSummaryService = function () {
      return this;
    };

    /**
     * @ngdoc method
     * @name matches.service:qcSummaryService#findAllBtw2Date
     * @methodOf service:qcSummaryService
     * @description get the list of all qcSummaries
     * @returns {httpPromise} of an array of string
     */


    QcSummaryService.prototype.findAllBtw2Date = function (dateFrom,dateTo) {

      return httpProxy.get('/qc/summary' + '/'+ dateFrom + '/' + dateTo );
    };

    QcSummaryService.prototype.list = function () {

      return httpProxy.get('/qc/summary' );
    };

    QcSummaryService.prototype.deleteAllBtw2Date = function (dateFrom,dateTo) {

      return httpProxy.delete('/qc/summary' + '/'+ dateFrom + '/' + dateTo);
    };

    QcSummaryService.prototype.updateInfoByRawfileInfo = function (updateInfo) {

        return httpProxy.put('/qc/summary', updateInfo,{headers: {'Content-Type': undefined}});

    };
    QcSummaryService.prototype.updateSelByRawfileInfo = function (updateInfo,updateType) {

      return httpProxy.put('/qc/summary/'+ updateType, updateInfo,{headers: {'Content-Type': undefined}});

    };

    return new QcSummaryService();
  })

  .controller('QcSummaryListCtrl', function($scope,$route,$window,filterFilter,QcSummaryService,QcDevInfoService){


    QcSummaryService.list().then(function(data){
      $scope.summaries = data;

      // helper method
      $scope.selectedSummaries = function selectedSummaries() {
        return filterFilter($scope.summaries, { selFlg: true });
      };

      $scope.machineGrp=getMachineGrp(data);
      $scope.columnGrp=getColumnGrp(data);

    });

    $scope.selectedSummaries = [];

    //$scope.selectedIds = [];
    $scope.updateSelection= function($index){
      console.log('index=' + $index);
      console.log('selected rawfileInfomation=' + $scope.summaries[$index].rawfileInfomation.Date +'_'+ $scope.summaries[$index].rawfileInfomation.Index );
      console.log('selected selFlg=' + $scope.summaries[$index].selFlg);
      var updateSel = {'rawfileInfomation':$scope.summaries[$index].rawfileInfomation,'selFlg':$scope.summaries[$index].selFlg};
      QcSummaryService.updateSelByRawfileInfo(updateSel,'sel').success(function (resp) {
        console.log('update successfully=', resp);
        $route.reload();
      }).error(function (error) {
        console.log('update failed=', error);
      });

    };


    //get Device infomation
    QcDevInfoService.list().then(function(data){
      $scope.devInfos = data;
      //console.log($scope.devInfos);

    });

    $scope.deleteQcSummary=function(dateFrom,dateTo) {

      if ((dateFrom !== undefined && dateFrom !=='') && (dateTo!== undefined && dateTo !=='')) {
        console.log(dateFrom);
        console.log(dateTo);
        QcSummaryService.deleteAllBtw2Date(dateFrom, dateTo).success(function () {
          //$scope.status = 'Qc Summary Data from \'' + dateFrom + '\' to \'' + dateTo + '\' were deleted successfully';
          var status = 'Qc Summary Data from \'' + dateFrom + '\' to \'' + dateTo + '\' were deleted successfully';
          //console.log('deleteQcSummary messege=' + $scope.status);
          //show the popup window when successfully deleted the data
          $window.alert(status);

          QcSummaryService.list().then(function (data) {
            $scope.summaries = data;
            $scope.machineGrp=getMachineGrp(data);
            $scope.columnGrp=getColumnGrp(data);
            $scope.dateFrom = '';
            $scope.dateTo = '';
          });
          //$route.reload();
        }).error(function (error) {
          console.log('failed=', error);
        });
      }

    };


    $scope.saveComments = function() {
      console.log('save comment');
      //console.log($scope.summaries);
      $scope.changedCmts = [];
      //make a list of changed comments in json data
      _.map($scope.summaries, function (s) {
        if (s.Cmt !== $scope.oldCmts[$scope.summaries.indexOf(s)]) {
          console.log('old cmt=' + $scope.oldCmts[$scope.summaries.indexOf(s)]);
          $scope.changedCmts.push({'rawfileInfomation':s.rawfileInfomation, 'Cmt':s.Cmt});
        }
      });

      console.log($scope.changedCmts);

      $scope.changedCmts.forEach(function (k) {
        QcSummaryService.updateInfoByRawfileInfo(k).success(function (resp) {
          console.log('update successfully=', resp);
          $route.reload();
        }).error(function (error) {
          console.log('update failed=', error);
        });
      });

    };



    $scope.findQcSummary = function(dateFrom,dateTo) {

      if (dateFrom===undefined || dateFrom===''){
        QcSummaryService.list().then(function(data){
        $scope.summaries = data;
      });
      }else {

        QcSummaryService.findAllBtw2Date(dateFrom, dateTo).then(function (data) {
          $scope.summaries = data;
        });

        QcDevInfoService.findDevInfoBtw2Date(dateFrom,dateTo).then(function(info){
          $scope.devInfos = info;
        });
      }
      getMachineGrp($scope.summaries);
      //$scope.status ='';
      //$route.reload();
    };

    var getMachineGrp= function(summaries){
      //console.log(_.uniq(_.map(summaries,function(s){return s.rawfileInfomation.machineName;})));
      return _.uniq(_.map(summaries,function(s){return s.rawfileInfomation.machineName;}));

    };
    var getColumnGrp= function(summaries){
      //console.log(_.uniq(_.map(summaries,function(s){return s.rawfileInfomation.columnType.substr(0,s.rawfileInfomation.columnType.length-3);})));
      return _.uniq(_.map(summaries,function(s){return s.rawfileInfomation.columnType.substr(0,s.rawfileInfomation.columnType.indexOf('_'));}));

    };
      //return new Set(_.map(summaries,function(s){
      //  return s.rawfileInfomation.machineName;
      //}));


    $scope.oldCmts= [];
    //restore the comments each time the data having been loaded
    $scope.addId = function($index,summaries){

      $scope.oldCmts.push(summaries[$index].Cmt);


    };

    $scope.devInfos=[];
    $scope.openDevInfoWindow = function () {



      window.$windowScope = $scope;

      console.log($scope.devInfos);

      $window.open('#/qcDeviceInfoEdit');
    };
});


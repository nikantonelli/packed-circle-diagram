Ext.define('packed-circle-diagram', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    itemId: 'rallyApp',
    portfolioSizingField:  function() {
        var piSize = gApp.down('#piSize');
        return piSize.getValue();
    },
    inheritableStatics: {
        UNSIZED_ITEM_STRING: 'unsized',
        DEPENDENCY_STRING: 'dependencies'
    },

    config: {
        defaultSettings: {
            useMilestones: false,
            hideArchived: false,
            showDependencies: false
        }
    },

    MIN_COLUMN_WIDTH:   200,       
    
    CARD_DISPLAY_FIELD_LIST:
    [
        'Name',
        'Owner',
        'PreliminaryEstimate',
        'Parent',
        'Project',
        'PercentDoneByStoryCount',
        'PercentDoneByStoryPlanEstimate',
        'State',
        'ScheduleState',
        'PredecessorsAndSuccessors'
    ],

    FETCH_FIELDS:
    [
            'Name',
            'FormattedID',
            'Parent',
            'DragAndDropRank',
            'Children',
            'ObjectID',
            'Project',
            'DisplayColor',
            'Owner',
            'Blocked',
            'BlockedReason',
            'Ready',
            'Tags',
            'Workspace',
            'RevisionHistory',
            'CreationDate',
            'PercentDoneByStoryCount',
            'PercentDoneByStoryPlanEstimate',
            'State',
            'ScheduleState',
            'PlanEstimate',
            'PreliminaryEstimate',
            'PreliminaryEstimateValue',
            'PredecessorsAndSuccessors',
            'Description',
            'Notes',
            'Predecessors',
            'Successors',
            'UserStories',
            'Tasks',
            'WorkProduct',
            'OrderIndex',   //Used to get the State field order index
            'Value',
    ],

    portfolioChildField: function() { return 'Children';},
    featureChildField: function() { return 'UserStories';},
    storySizingField: function() { return 'PlanEstimate';},
    storyChildField: function() { return 'Tasks';},  //What to do about stories and defects?!?!
    taskSizingField: function() { return 'Estimate';},    //Might want to add a selector to choose 'ToDo' instead based on whether the field is a 'double'
    //No child field
    items: [
        {
            xtype: 'container',
            itemId: 'headerBox',
            layout: 'hbox',
            height: 30
        },
        {
            xtype: 'container',
            itemId: 'rootSurface',
            margin: '10 10 10 10',
            layout: 'auto',
            title: 'Loading...',
            autoEl: {
                tag: 'svg'
            },
            listeners: {
                afterrender:  function() {  gApp = this.up('#rallyApp'); gApp._onElementValid(this);},
                resize: function() {  gApp = this.up('#rallyApp'); gApp._onElementResize(this);}
            },
            visible: false
        }
    ],
    launch: function() {
    },

    // getSettingsFields: function () {
    //     return [
    //         {
    //             name: 'useMilestones',
    //             xtype: 'rallycheckboxfield',
    //             fieldLabel: 'Use Milestones as source (IN DEVELOPMENT): '
    //         }
    //     ];
    // },

    onSettingsUpdate: function(settings){
        this.callParent(arguments);
        //Remove old items and restart
        this.down('#headerBox').removeAll();
        gApp._onElementValid(gApp.down('#rootSurface'));
    },

    onTimeboxScopeChange: function(newTimebox) {
        this.callParent(arguments);
        gApp.timeboxScope = newTimebox;
        gApp._enterMainApp();
    },

    _onElementResize: function(rs) {
        this._setSVGSize(rs);
        //TODO: Set zoom
    },
    //Set the SVG area to the surface we have provided
    _setSVGSize: function(surface) {
        var svg = d3.select('svg');
        svg.attr('width', surface.getEl().dom.clientWidth);
        svg.attr('height',surface.getEl().dom.clientHeight);
    },
    //Entry point after creation of render box
    _onElementValid: function(rs) {
        gApp.timeboxScope = gApp.getContext().getTimeboxScope();        
        //Create an empty list of svg items (global)
        nodeList = null;
        //Add any useful selectors into this container ( which is inserted before the rootSurface )
        //Choose a point when all are 'ready' to jump off into the rest of the app

        if (!gApp.getSetting('useMilestones')){
            gApp.down('#headerBox').add(

                {
                    xtype:  'rallyportfolioitemtypecombobox',
                    itemId: 'piType',
                    margin: '5 0 5 20',
                    listeners: {
                        select: function() { 
                            gApp._enterMainApp();
                        },    //Jump off here to add portfolio size selector
                        afterrender: function() { 
                            gApp._addSizeSelector();
                        }
                    }            
                }
            );
        } else {
            var fetchFields = gApp.FETCH_FIELDS.concat(['TargetProject', 'TargetDate', 'Artifacts']);
            var mbox = gApp.down('#headerBox').add(

                {
                    xtype:  'rallymilestonecombobox',
                    itemId: 'milestoneSelected',
                    storeConfig: {
                        fetch: fetchFields
                    },
                    margin: '5 0 5 20',
                    listeners: {
                        boxready: function() { 
                            this.on('setvalue', gApp._addSizeSelector);
                        //     gApp._enterMainApp();
                        // },    //Jump off here to add portfolio size selector
                        // setvalue: function() { 
                        //     gApp._addSizeSelector();
                        }
                    }            
                }
            );
//            Ext.util.Observable.capture( mbox, function(event) { console.log('event', event, arguments);});
        }
    },
    _addSizeSelector: function() {
        console.log('Adding size selector');
        if (!gApp.down('#piSize')){
            gApp.down('#headerBox').add(
                {
                        xtype: 'rallycombobox',
                        margin: '5 0 5 20',
                        itemId: 'piSize',
                        fieldLabel: 'Portfolio Sizing:',
                        width: 300,
                        displayField: 'name',
                        valueField: 'value',
                        editable: false,
                        storeType: 'Ext.data.Store',
                        storeConfig: {
                            remoteFilter: false,
                            fields: ['name', 'value'],
                            data: [
                                { 'name': 'Leaf Story Plan Estimate', 'value': 'LeafStoryPlanEstimateTotal'},
                                { 'name': 'Leaf Story Count', 'value': 'LeafStoryCount'},
                                { 'name': 'Refined Estimate', 'value': 'RefinedEstimate'},
                                { 'name': 'Preliminary Estimate', 'value': 'PreliminaryEstimateValue' },
                                { 'name': 'Value Score', 'value' : 'ValueScore'}
                            ],
                        },
                        listeners: {
                            select: function() { gApp._enterMainApp();},    //Jump off here to app
                            afterrender: function() { gApp._enterMainApp();}    //Jump off here to app
                        }
                }
            );
        }
        if (!gApp.down('#highlight')){
            gApp.down('#headerBox').add(
                {
                        xtype: 'rallycombobox',
                        margin: '5 0 5 20',
                        itemId: 'highlight',
                        fieldLabel: 'Emphasise on:',
                        width: 300,
                        displayField: 'name',
                        valueField: 'value',
                        editable: false,
                        storeType: 'Ext.data.Store',
                        storeConfig: {
                            remoteFilter: false,
                            fields: ['name', 'value'],
                            data: [
                                { 'name': 'Unsized Item', 'value': gApp.self.UNSIZED_ITEM_STRING},
                                { 'name': 'Dependencies', 'value': gApp.self.DEPENDENCY_STRING}
                            ],
                        },
                        listeners: {
                            select: function() { gApp._enterMainApp();},    //Jump off here to app
                        }
                }
            );
        }
    },

    //Continuation point after selectors ready/changed
    _enterMainApp: function() {

        console.log('Entering main app...');
        //Clear the decks as we are dealing with a new type
        if (nodeList) nodeList.remove();
        //Make surface the size available in the viewport (minus the selectors and margins)
        var rs = this.down('#rootSurface');
        rs.getEl().setWidth(this.getSize().width - 20);
        rs.getEl().setHeight((this.getSize().height - rs.getBox().top) - 15);
        var svg = d3.select('svg');
        svg.attr('class', 'rootSurface');
        //Set the svg area to the surface
        this._setSVGSize(rs);
        //Define a global for the edge of view so circles don't hit the edge of the surface (or parent circle) - looks better!
//        circleMargin = 0.02;
        circleMargin = 0;
        //Create a colour scheme
        this._createColourScheme();
        //Define a global for the current perspective
        view = null;
        //Define the size of the whole thing. We refer to this when zooming
        rootDiameter = Math.min( svg.attr("width"), svg.attr("height"));    //Set maximum size at start
        //Create a grouping to use for all drawn items so we can zoom about at will and set the view to the middle

        g = svg.append("g").attr("transform", "translate(" + rootDiameter / 2 + "," + rootDiameter / 2 + ")");
        //Define a global  for the last thing clicked
        focus = null;
        //Create the initial dataset in this form
        // var root = { 'name' : 'root', 'children': [ { 'name' : 'child1','size': 200 },{ 'name' : 'child2','children' : [{  etc. etc. }] }]};
        var topRoot = { 'name' : 'root', 'children': [ ]};
        var filters = [];
        var fetchFields = gApp.FETCH_FIELDS.concat([gApp.portfolioSizingField()]);

        if ( !gApp.getSetting('useMilestones')){
            //Get the piType we are starting with
            var piType = gApp.down('#piType');
            var piName = piType.getRawValue();

            if((gApp.timeboxScope && gApp.timeboxScope.type.toLowerCase() === 'release') &&
                (piType.valueModels[0].data.Ordinal === 0)  //Only for lowest level item type
                ){
                filters.push(gApp.timeboxScope.getQueryFilter());
            }
            var rootStore = Ext.create('Rally.data.wsapi.Store', {
                model: 'PortfolioItem/' + piName,
                context: {
                    projectScopeUp: gApp.getContext().getProjectScopeUp(),
                    
                    projectScopeDown: gApp.getContext().getProjectScopeDown()
                },
                autoLoad: true,
                filters: filters,
                listeners: {
                    load: function(store, data, success) {
                        _.each(data, function(d) {
                            var s;
                            //Decide what data you want for these things
                            topRoot.children.push(gApp._createNodeForArtefact(d));
                        });
                        //If we had some data, then set up to call _runSVG
                        if (topRoot.children.length) {
                            //Define root in hierarchy
                            var root = d3.hierarchy(topRoot)
                                .sum(function(d) { return d.size; })
                                .sort(function(a, b) { return b.value - a.value; });
                            //Define this as the item of interest
                            focus = root;
                            //Add all the stuff to SVG
                            gApp._runSVG(root, rootDiameter);
                            //Add a 'return to the beginning' ability
                            svg.on("click", function() { gApp._zoom(root, d3.event); });
                            //If any added refresh the 'node' handle
                            gApp._updateNodeList();
                            //Now get the view to the right place
                            gApp._zoomTo([root.x, root.y, root.r * 2 + (circleMargin * rootDiameter)], nodeList);
                        }
                        //If no data returned, be nice, let the user know!
                        else Rally.ui.notify.Notifier.show({message: 'No items found in project of type selected'});
                    }
                },
                fetch: fetchFields
            });
        }else {
            //Get the Artefacts collection from the Milestone
            var selected = gApp.down('#milestoneSelected').getRecord();
            var collectionConfig = {
                fetch: fetchFields,
                callback: function(data, operation, success) {
                    if (!success) Rally.ui.notify.Notifier.show({message: 'Failed to fetch items for milestone: ' + selected.get('Name')});
                    _.each(data, function(d) {
                        var s;
                        d.data = d.raw;     //Fix Snafu with using artifactstore
                        //Decide what data you want for these things
                        topRoot.children.push(gApp._createNodeForArtefact(d));
                    });
                    //If we had some data, then set up to call _runSVG
                    if (topRoot.children.length) {
                        //Define root in hierarchy
                        var root = d3.hierarchy(topRoot)
                            .sum(function(d) { return d.size; })
                            .sort(function(a, b) { return b.value - a.value; });
                        //Define this as the item of interest
                        focus = root;
                        //Add all the stuff to SVG
                        gApp._runSVG(root, rootDiameter);
                        //Add a 'return to the beginning' ability
                        svg.on("click", function() { gApp._zoom(root, d3.event); });
                        //If any added refresh the 'node' handle
                        gApp._updateNodeList();
                        //Now get the view to the right place
                        gApp._zoomTo([root.x, root.y, root.r * 2 + (circleMargin * rootDiameter)], nodeList);
                    }
                    //If no data returned, be nice, let the user know!
                    else Rally.ui.notify.Notifier.show({message: 'No items found on milestone selected'});
                }
            };
            selected.getCollection('Artifacts').load( collectionConfig );
        }
    },
    _getNodeId: function(d){
        return d.data.record? d.data.record.get('FormattedID'): Ext.id();
    },
    _addChildren: function(record, sn) {
        //Other circles are to be ignored  here
        if (!record){
            return;
        }
        //Have we been here before
        if (sn.children && sn.children.length>0){
            //Just zoom to it and leave
            if (focus !== sn) gApp._zoom(sn, 0);
            return;
        }
        // Can't add children if there aren't any (e.g. Task level?)
        if ( gApp._getNodeChildField(record) === null ) {
            return;
        }
        var filters = [];
        if((gApp.timeboxScope && gApp.timeboxScope.type.toLowerCase() === 'release') && ((record.self.ordinal === 1)|| (record.self.ordinal === 0)))  //Only for lowest level item type and userstories        
        {
            filters.push(gApp.timeboxScope.getQueryFilter());
        }

        var name = record.get('FormattedID');
        var storyRoot = { 'name' : name, 'children': [ {'name': name, 'size':1}]};
        var fetchFields = gApp.FETCH_FIELDS.concat([gApp._getChildSizingField(record)]);
        var childField = gApp._getNodeChildField(record);
        record.getCollection(childField).load({
                fetch: fetchFields,
                filters: filters,
                callback: function (records, operation, success) {
                    if (success && (records.length>0)){
                        _.each(records, function(r) {
                            storyRoot.children.push(gApp._createNodeForArtefact(r));
                        });
                        storyRoot = d3.hierarchy(storyRoot)
                            .sum(function(d) { return d.size; })
                            .sort(function(a, b) { return b.value - a.value; });
                        var usPack = d3.pack()
                            .size([sn.r  * 2 * (1 - circleMargin), sn.r * 2 * ( 1 - circleMargin)])
                            .padding(2);
                        var storyPack = usPack(storyRoot).descendants();
                        //Update parameters for each new item
                        storyPack.forEach( function(d) {
                            //Move the circles to the right location on the screen
                            d.x += (sn.x - sn.r); d.y += (sn.y - sn.r);
                            //Give them a parent
                            d.parent = sn;
                            //Update thier depth
                            d.depth += sn.depth;
                        });
                        //Give them to the parent
                        sn.children = storyPack;
                        //Add them into the group
                        var storyCircle = g.selectAll("circle")
                                    .data(storyPack, gApp._getNodeId)
                                    .enter().append("circle")
                                    .attr("r", function(d) { return d.r ; })
                                    .style("fill", function(d) { return gApp._getNodeColour(d ); })
                                    .style("display", function(d) { return d.data.record ? "inline" : "none"; })
                                    .attr('id', function(d) {
                                        gApp._addChildren(d.data.record, d);
                                        return "circle-"+  gApp._getNodeId(d) ;
                                    })
                                    .on('click', function (node, index, array) {
                                        var event = d3.event;
                                        event.stopPropagation();
                                        gApp._updateNodeList();
                                        if (event.shiftKey) { 
                                            gApp._nodePopup(node,index,array); 
                                        }  else if (focus !== node) { 
                                            gApp._zoom(node, event);
                                        }  else {
                                            gApp._dataPanel(node,index,array);
                                        }
                                    })
                                    .on("mouseover", function(node, index, array) { gApp._nodeMouseOver(node,index,array);})
                                    .on("mouseout", function(node, index, array) { gApp._nodeMouseOut(node,index,array);})
                                    .attr("class", function(d) {
                                        return gApp._getCircleNodeClass(d);
                                    });
                        storyCircle.merge(storyCircle);
                        //Add text labels
                        var text = g.selectAll("text")
                            .data(storyPack, gApp._getNodeId)
                            .enter().append("text")
                            .attr("class", "applink")
                            .text(function(d) { return d.data.name; });
                        gApp._updateNodeList();
                        gApp._zoom(focus, 0);
                    }
                }
            }
        );
    },

    _dataPanel: function(node, index, array) {
        var childField = gApp._hasField(node.data.record,'Children')? 'Children' : 'UserStories';
        var model = gApp._hasField(node.data.record,'Children')? node.data.record.raw.Children._type : 'UserStory';
        Ext.create('Rally.ui.dialog.Dialog', {
            autoShow: true,
            draggable: true,
            closable: true,
            width: 1100,
            height: 800,
            style: {
                border: "thick solid #000000"
            },
            overflowY: 'scroll',
            overflowX: 'none',
            record: node.data.record,
            disableScroll: false,
            model: model,
            childField: childField,
            title: 'Information for ' + node.data.record.get('FormattedID') + ': ' + node.data.record.get('Name'),
            layout: 'hbox',
            items: [
                {
                    xtype: 'container',
                    itemId: 'leftCol',
                    width: 500,
                },
                // {
                //     xtype: 'container',
                //     itemId: 'middleCol',
                //     width: 400
                // },
                {
                    xtype: 'container',
                    itemId: 'rightCol',
                    width: 580  //Leave 20 for scroll bar
                }
            ],                                                    
            nonRAIDStoreConfig: function() {
                if (gApp._hasField(this.record,'c_RAIDType') ){
                    switch (this.record.self.ordinal) {
                        case 1:
                            return  {
                                filters: {
                                    property: 'c_RAIDType',
                                    operator: '=',
                                    value: ''
                                }
                            };
                        default:
                            return {};
                    }
                }
                else return {};
            },
            listeners: {
                afterrender: function() {
                    this.down('#leftCol').add(
                        {
                                xtype: 'rallycard',
                                record: this.record,
                                fields: gApp.CARD_DISPLAY_FIELD_LIST,
                                showAge: true,
                                resizable: true
                        }
                    );

                    if ( this.record.get('c_ProgressUpdate')){
                        this.down('#leftCol').insert(1,
                            {
                                xtype: 'component',
                                width: '100%',
                                autoScroll: true,
                                html: this.record.get('c_ProgressUpdate')
                            }
                        );
                        this.down('#leftCol').insert(1,
                            {
                                xtype: 'text',
                                text: 'Progress Update: ',
                                style: {
                                    fontSize: '13px',
                                    textTransform: 'uppercase',
                                    fontFamily: 'ProximaNova,Helvetica,Arial',
                                    fontWeight: 'bold'
                                },
                                margin: '0 0 10 0'
                            }
                        );
                    }
                    //This is specific to customer. Features are used as RAIDs as well.
                    if ((this.record.self.ordinal === 1) && gApp._hasField(this.record,'c_RAIDType')){
                        var rai = this.down('#leftCol').add(
                            {
                                xtype: 'rallypopoverchilditemslistview',
                                target: array[index],
                                record: this.record,
                                childField: this.childField,
                                addNewConfig: null,
                                gridConfig: {
                                    title: '<b>Risks and Issues:</b>',
                                    enableEditing: false,
                                    enableRanking: false,
                                    enableBulkEdit: false,
                                    showRowActionsColumn: false,
                                    storeConfig: this.RAIDStoreConfig(),
                                    columnCfgs : [
                                        'FormattedID',
                                        'Name',
                                        'c_RAIDType',
                                        'State',
                                        'c_RAGStatus',
                                        'ScheduleState'
                                    ]
                                },
                                model: this.model
                            }
                        );
                        rai.down('#header').destroy();
                   }
                    var children = this.down('#leftCol').add(
                        {
                            xtype: 'rallypopoverchilditemslistview',
                            target: array[index],
                            record: this.record,
                            childField: this.childField,
                            addNewConfig: null,
                            gridConfig: {
                                title: '<b>Children:</b>',
                                enableEditing: false,
                                enableRanking: false,
                                enableBulkEdit: false,
                                showRowActionsColumn: false,
                                storeConfig: this.nonRAIDStoreConfig(),
                                columnCfgs : [
                                    'FormattedID',
                                    'Name',
                                    {
                                        text: '% By Count',
                                        dataIndex: 'PercentDoneByStoryCount'
                                    },
                                    {
                                        text: '% By Est',
                                        dataIndex: 'PercentDoneByStoryPlanEstimate'
                                    },
                                    'Project',
                                    'PredecessorsAndSuccessors',
                                    'State',
                                    'c_RAGSatus',
                                    'ScheduleState'
                                ]
                            },
                           model: model
                        }
                    );
                    children.down('#header').destroy();

                    var cfd = Ext.create('Rally.apps.CFDChart', {
                        record: this.record,
                        container: this.down('#rightCol')
                    });
                    cfd.generateChart();

                    //Now add predecessors and successors
                    var preds = this.down('#rightCol').add(
                        {
                            xtype: 'rallypopoverchilditemslistview',
                            target: array[index],
                            record: this.record,
                            childField: 'Predecessors',
                            addNewConfig: null,
                            gridConfig: {
                                title: '<b>Predecessors:</b>',
                                enableEditing: false,
                                enableRanking: false,
                                enableBulkEdit: false,
                                showRowActionsColumn: false,
                                columnCfgs : [
                                'FormattedID',
                                'Name',
                                {
                                    text: '% By Count',
                                    dataIndex: 'PercentDoneByStoryCount'
                                },
                                {
                                    text: '% By Est',
                                    dataIndex: 'PercentDoneByStoryPlanEstimate'
                                },
                                'Parent',
                                'State',
                                'c_RAGSatus',
                                'ScheduleState'
                                ]
                            },
                            model: this.model
                        }
                    );
                    preds.down('#header').destroy();
                    var succs = this.down('#rightCol').add(
                        {
                            xtype: 'rallypopoverchilditemslistview',
                            target: array[index],
                            record: this.record,
                            childField: 'Successors',
                            addNewConfig: null,
                            gridConfig: {
                                title: '<b>Successors:</b>',
                                enableEditing: false,
                                enableRanking: false,
                                enableBulkEdit: false,
                                showRowActionsColumn: false,
                                columnCfgs : [
                                'FormattedID',
                                'Name',
                                {
                                    text: '% By Count',
                                    dataIndex: 'PercentDoneByStoryCount'
                                },
                                {
                                    text: '% By Est',
                                    dataIndex: 'PercentDoneByStoryPlanEstimate'
                                },
                                'Parent',
                                'State',
                                'c_RAGSatus',
                                'ScheduleState'
                                ]
                            },
                            model: this.model
                        }
                    );
                    succs.down('#header').destroy();
                }
            }
        });

    },

    _nodeMouseOut: function(node, index,array){
        if (node.card) node.card.hide();
    },

    _nodeMouseOver: function(node,index,array) {
        if (!(node.data.record.data.ObjectID)) {
            //Only exists on real items, so do something for the 'unknown' item
            return;
        } else {

            if ( !node.card) {
                var card = Ext.create('Rally.ui.cardboard.Card', {
                    'record': node.data.record,
                    fields: gApp.CARD_DISPLAY_FIELD_LIST,
                    constrain: false,
                    width: gApp.MIN_COLUMN_WIDTH,
                    height: 'auto',
                    floating: true, //Allows us to control via the 'show' event
                    shadow: false,
                    showAge: true,
                    resizable: true,
                    listeners: {
                        show: function(card){
                            //Move card to one side, preferably closer to the centre of the screen
                            var xpos = array[index].getScreenCTM().e - gApp.MIN_COLUMN_WIDTH;
                            var ypos = array[index].getScreenCTM().f;
                            card.el.setLeftTop( (xpos - gApp.MIN_COLUMN_WIDTH) < 0 ? xpos + gApp.MIN_COLUMN_WIDTH : xpos - gApp.MIN_COLUMN_WIDTH, 
                                (ypos + this.getSize().height)> gApp.getSize().height ? gApp.getSize().height - (this.getSize().height+20) : ypos);  //Tree is rotated
                        }
                    }
                });
                node.card = card;
            }
            node.card.show();
        }
    },
    
    _nodePopup: function(node, index, array) {
        var popover = Ext.create('Rally.ui.popover.DependenciesPopover',
            {
                record: node.data.record,
                target: node.card.el,
                listeners: {
                    afterrender: function(card){
                        //Move card to one side, preferably closer to the centre of the screen
                        var xpos = array[index].getScreenCTM().e - gApp.MIN_COLUMN_WIDTH;
                        var ypos = array[index].getScreenCTM().f;
                        card.el.setLeftTop( (xpos - gApp.MIN_COLUMN_WIDTH) < 0 ? xpos + gApp.MIN_COLUMN_WIDTH : xpos - gApp.MIN_COLUMN_WIDTH, 
                            (ypos + this.getSize().height)> gApp.getSize().height ? gApp.getSize().height - (this.getSize().height+20) : ypos);  //Tree is rotated
                    }
                }
            }
        );
    },

    _runSVG: (function(root, diameter) {
        // re-find the svg
        var svg = d3.select('svg');
        var pack = d3.pack()
            .size([diameter  * (1 - circleMargin), diameter * ( 1 - circleMargin)])
            .padding(2);
        var nodes = pack(root).descendants();
        var circle = g.selectAll("circle")
            .data(nodes, gApp._getNodeId)
            .enter().append("circle")
            .attr('id', function(d) {
                gApp._addChildren(d.data.record, d);
                gApp._updateNodeList();
                return gApp._getNodeId(d);
            })
            .on('click', function (node, index, array) {
                var event = d3.event;
                event.stopPropagation();
                gApp._updateNodeList();
                if (event.shiftKey) { 
                    gApp._nodePopup(node,index,array); 
                }  else if (focus !== node) { 
                    gApp._zoom(node, event);
                }  else {
                    gApp._dataPanel(node,index,array);
                }
            })

            .on("mouseover", function(node, index, array) { gApp._nodeMouseOver(node,index,array);})
            .on("mouseout", function(node, index, array) { gApp._nodeMouseOut(node,index,array);})
            .attr("class", function(d) {  return gApp._getCircleNodeClass(d);})
                .style("fill", function(d) { return gApp._getNodeColour(d); })
                .style("display", function(d) { return d.data.record ? "inline" : "none"; });
        text = g.selectAll("text")
            .data(nodes)
            .enter().append("text")
                .attr("class", "applink")
                .text(function(d) { return d.data.name; });
        gApp._setTextVisibility(text);
        return false;
    }),

    _getCircleNodeClass: function(d) {
        var record = d.data.record;
        var vClass = d.parent ? d.children ? "node" : "nodeLeaf" : "nodeRoot";
        var hv = gApp.down('#highlight').getValue();
        if (record && (record.get('_type') !== 'task')) {
            if (hv === gApp.self.DEPENDENCY_STRING) {
                if (record.raw.Predecessors.Count) 
                    vClass += " nodeError";
                else if (record.raw.Successors.Count)
                    vClass += " nodeWarn";
            } else if (hv === gApp.self.UNSIZED_ITEM_STRING) {
                if (!record.get(gApp._getNodeSizingField(record)))
                    vClass += " nodeError";    
            }
        }
        return vClass;
    },

    _setTextVisibility: function(labels) {
          labels
              .style("display", function(d) {
                    var visible = ((d.parent === focus) ? 1 : 0);     //Set visibility for items that have not had children worked out
                    visible = (d.children?0:visible);              // Add those text labels for the virtual children
                    return visible?"inline":"none";
                })
              ;
    },
    //Some helper functions specific to the SVG
    _zoomTo: function(v, elements) {
        //Work out relation to the big picture
        var k = rootDiameter / v[2];
        //Store the current requested view area
        view = v;
        //Apply the transformation to the list of things
        elements.attr("transform", function(d) {
            return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")";
        });
        //If there are any circles in there, we need to adjust the radius as well.
        var circles = elements.filter("circle");
        circles.attr("r", function(d) { return d.r * k; });
//        //When we zoom, check text visibility
//        var text = g.selectAll("text");
//        gApp._setTextVisibility(text);
      },
    _zoom: function(d, event) {
        //Highlight that we are now looking at this thing
        focus = d;
        //Start the animation to the new thing
        var transition = d3.transition()
            .duration(event && event.altkey?3000:750)
            .tween("zoom", function(d) {
                if (!focus) return;
                var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
//              var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + (circleMargin * rootDiameter)]);
              return function(t) { gApp._zoomTo(i(t), nodeList); };
            })
            .on("end", function() {
                //Work out whether we need to hide any text
                gApp._setTextVisibility(g.selectAll("text"));
            });

      },
    _createColourScheme: function() {
        //Create a colour scheme global
        colour = d3.scaleLinear()
            .domain([-1,6])
            .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
            .interpolate(d3.interpolateHcl)
            ;
    },
    _createNodeForArtefact: function (d) {
        var s = d.get(gApp._getNodeSizingField(d));
        return ({ 'name': d.get('FormattedID'), 'size' : s?s:1, 'record': d});
    },
    //Decide the colouring of the main circle for this node
    //Add children information if required
    _getNodeColour: function(d) {
        if (!(d.data.record)) return null;
        //If we have the field on the record with some stuff in it, use it to colour (for now, just use the depth)
        return colour(d.depth);
//        return (d.data.record && d.data.record.get(gApp._getNodeSizingField(d.data.record))) ? colour(d.depth) : "white";
    },

    _isPortfolioItem: function ( d ) {
        return d.get('_type').toLowerCase().startsWith('portfolioitem/');
    },

    _getNodeSizingField: function ( d) {
        //Assume we are at Task level (ignoring Test Sets, etc.,)
        var sizingField = gApp.taskSizingField;
        if (gApp._isPortfolioItem(d)) {
            //Only user portfolioitems have the field 'UserStories'.
            sizingField = gApp.portfolioSizingField;
        }
        else if (d.isUserStory()) {
            //Only user stories/defects have the field 'Tasks'.
            sizingField = gApp.storySizingField;
        }
        return sizingField();
    },
    _getChildSizingField: function ( d) {
        //Assume we are at Task level (ignoring Test Sets, etc.,)
        var childSizingField = function() { return null;};

        if (gApp._isPortfolioItem(d)) {
            //Only user portfolioitems have the field 'UserStories'.
            childSizingField = gApp.portfolioSizingField;
            if (gApp._hasField(d, gApp.featureChildField())){
                childSizingField = gApp.storySizingField;
            }
        }
        else if (d.isUserStory()) {
            //Only user stories/defects have the field 'Tasks'.
            childSizingField = gApp.taskSizingField;
        }
        return childSizingField();
    },
    _getNodeSizingUnit: function (d) {
        var sizingUnit = 'Hours';   //Start at task level
        if (d.isTask() === false) {
            sizingUnit = 'Points';
        }
        return sizingUnit;
    },
    _hasField: function(d, field) {
        return (field in d.raw) ? true : false;
    },

    _getNodeChildField: function ( d) {
        //Assume we are at Task level (ignoring Test Sets, etc.,)
        var childField = function() { return null;};
        if (gApp._isPortfolioItem(d)) {
            childField = gApp.portfolioChildField;
            //Only lowest level portfolioitems have the field 'UserStories'.
            if (gApp._hasField(d, gApp.featureChildField())){
                childField = gApp.featureChildField;
            }
        }
        else if (d.isUserStory()) {
            //Only user stories/defects have the field 'Tasks'.
            childField = gApp.storyChildField;
        }
        return childField();
    },
    _updateNodeList: function() {
            nodeList = g.selectAll("circle,text");  //Create a global for zooming of all things in the picture
    }
});

Ext.define( 'Rally.ui.cardboard.myCard', {
    extend: 'Rally.ui.cardboard.Card',
    alias: 'widget.myCard',

    //Override html so that we can fetch dependencies
    _buildHtml: function () {
        var html = [];

        var artifactColorDiv = {
            tag: 'div',
            cls: 'artifact-color'
        };
        if (this.record.get('DisplayColor')) {
            artifactColorDiv.style = {
                backgroundColor: this.record.get('DisplayColor')
            };
        }
        html.push(Ext.DomHelper.createHtml(artifactColorDiv));
        html.push('<div class="card-table-ct"><table class="card-table"><tr>');

        Ext.Array.push(
            html,
            _.invoke(
                _.compact([this.contentLeftPlugin, this.contentRightPlugin]),
                'getHtml'
            )
        );

        html.push('</tr></table>');

        if (this.iconsPlugin) {
            html.push(this.iconsPlugin.getHtml());
        }

        html.push('</div>');

        return html.join('\n');
    }
});
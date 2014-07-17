var ColumnNamesMixin = Ember.Mixin.create({
    properties:function () {
        var array = [];
        var content = this.get('content').toArray();
        if (content.length > 0) {
            var obj = Object.keys(content.get(0));
            $.each(obj, function (key, value) {
                array.push(value);
            });
        }
        return array;
    }.property('content')
});

var PaginationMixin = Ember.Mixin.create({
//    queryParams:['page', 'itemsPerPage'],
    itemsPerPage:20,
    perPageSelector:[10, 20, 30, 40, 50],
    currentPage:1,
    page:1,
    pageObserver:function () {
        this.set('currentPage', this.get('page'));
    }.observes('page'),
    prev:function () {
        return this.get('currentPage') > 1;
    }.property('currentPage'),
    next:function () {
        return this.get('currentPage') != this.get('availablePages');
    }.property('currentPage', 'availablePages'),
    pages:function () {
        var availablePages = this.get('availablePages'),
            pages = [];
        for (var i = 0; i < availablePages; i++) {
            var page = i + 1;
            pages.push(page.toString());
        }
        return pages;
    }.property('availablePages'),
    nextPage:function () {
        var nextPage = parseInt(this.get('currentPage')) + 1;
        var availablePages = this.get('availablePages');
        if (nextPage <= availablePages) {
            return nextPage;
        } else {
            return this.get('currentPage');
        }
    }.property('currentPage', 'availablePages'),
    prevPage:function () {
        var prevPage = parseInt(this.get('currentPage')) - 1;
        if (prevPage > 0) {
            return prevPage;
        } else {
            return this.get('currentPage');
        }
    }.property('currentPage', 'availablePages'),
    availablePages:function () {
        return Math.ceil((this.get('fullData.length') / this.get('itemsPerPage')) || 1);
    }.property('fullData.length', 'itemsPerPage'),
    paginatedContent:function () {
        var currentPage = this.get('currentPage') || 1;
        var upperBound = (currentPage * this.get('itemsPerPage'));
        var lowerBound = (currentPage * this.get('itemsPerPage')) - this.get('itemsPerPage');
        var models = this.get('fullData');
        return models.slice(lowerBound, upperBound);
    }.property('currentPage', 'fullData.@each', 'itemsPerPage'),
    actions:{
        nextPage:function () {
            if (this.get('currentPage') >= this.get('availablePages')) {
                return null;
            }
            this.set('currentPage', this.get('currentPage') + 1);
        },
        previousPage:function () {
            if (this.get('currentPage') <= 1) {
                return null;
            }
            this.set('currentPage', this.get('currentPage') - 1);
        }
    }
});

//creates an array sortable on columns and searchable as well
var DataTableMixin = Ember.Mixin.create(ColumnNamesMixin,Ember.SortableMixin, PaginationMixin, {
    searchable:true,
    sortProperties:['id'],
    sortAscending:true,
    search:'',
    appliedFilters:[],
    actions:{
        propSort:function (property) {
            this.set('sortAscending', (this.sortProperties[0] === property ? !this.sortAscending : true));
            this.set('sortProperties', [property]);
            this.set('currentPage', 1);
        },
        applyFilter:function () {
            var appliedFilters = this.get('appliedFilters');
            var filterName = this.get('filterName');
            var filterValue = this.get('filterValue');
            var obj = {name:filterName, value:filterValue};
            appliedFilters.pushObject(obj);
            this.set('filterValue', '');
        },
        removeFilter:function (name, value) {
            var appliedFilters = this.get('appliedFilters');
            var newFilters = [];
            $.each(appliedFilters, function (key, value) {
                if (value.name != name) {
                    newFilters.push({name:value.name, value:value.value});
                }
            });
            this.set('appliedFilters', newFilters);
        }
    },
    headers:function () {
        var properties = this.get('properties');
        var obj = [];
        var sortBy = this.get('sortBy');
        var order = this.get('order');
        $.each(properties, function (key, value) {
            obj.push({name:value, order:(!Ember.isEmpty(sortBy) ? (sortBy == value ? (!Ember.isEmpty(order) ? (order == 'asc' ? 'desc' : 'asc') : 'asc') : 'asc') : 'asc')});
        });
        return obj;
    }.property('properties', 'sortBy', 'order'),
    availableFilters:function () {
        var filters = this.get('filters');
        var appliedFilters = this.get('appliedFilters');
        var columns = [];
        var availableFilters = [];
        $.each(appliedFilters, function (key, value) {
            columns.push(value.name);
        });

        $.each(filters, function (key, value) {
            if ($.inArray(value, columns) == -1) {
                availableFilters.push(value);
            }
        });
        this.set('filterName', availableFilters[0]);
        return availableFilters;
    }.property('appliedFilters.length'),
    filters:function () {
        return this.get('properties');
    }.property('properties'),
    sortedContent:function () {
        return this.toArray();
    }.property('content', 'sortAscending', 'sortProperties'),
    searchedContent:function () {
        var searchedContent;
        var search = this.get('search').trim();
        var properties = this.get('properties');
        var sortedContent = this.get('sortedContent');
        searchedContent = $.grep(sortedContent, function (element, index) {
            var valid = 0;
            element = Ember.Object.create(element);
            $.each(properties, function (key, value) {
                valid = valid || (element.get(value).toString().indexOf(search) + 1);
            });

            return (valid > 0);
        });
        return searchedContent.toArray();
    }.property('search','sortedContent'),
    filteredContent:function () {
        console.log('here');
        var searchedContent = this.get('searchedContent');
        var filteredContent;
        var appliedFilters = this.get('appliedFilters');
        filteredContent = $.grep(searchedContent.toArray(), function (element, index) {
            var valid = 1;
            element = Ember.Object.create(element);
            $.each(appliedFilters, function (key, value) {
                console.log(value.value);
                console.log(element.get(value.name));
                console.log(element.get(value.name).toString() == value.value.toString());
                valid = valid && (element.get(value.name).toString() == value.value.toString());
            });
            return (valid > 0);
        });
        console.log(filteredContent);
        return filteredContent.toArray();
    }.property('filterName','searchedContent'),
    fullData:function () {
               return this.get('filteredContent');
    }.property('filteredContent'),
    searchObserver:function () {
        this.set('currentPage', 1);
    }.observes('search'),
    sortByObserver:function () {
        var sortBy = this.get('sortBy');
        this.set('sortProperties', (!Ember.isEmpty(sortBy) ? [sortBy] : ['id']));
    }.observes('sortBy'),
    orderObserver:function () {
        var order = this.get('order');
        this.set('sortAscending', (!Ember.isEmpty(order) ? order == 'asc' : true));
    }.observes('order')
});

//component to create a table using sortable & searchable array
var DataTableComponent = Ember.Component.extend(Ember.TargetActionSupport, {
    cssClass:'',
    actions:{
        loading:function () {
            this.set('cssClass', 'overlay');
            console.debug('loading state');
            return true;
        },
        ready:function () {
            this.set('cssClass', '');
            console.debug('ready state');
            return true;
        },
        getSortedContent:function (prop) {
            this.send('loading');
            this.sendAction('propSort', prop);
            this.send('ready');

        },
        getNextPage:function () {
            this.sendAction('nextPage');
            this.send('ready');
        },
        getPreviousPage:function () {
            this.send('loading');
            this.sendAction('previousPage');
            this.send('ready');
        },
        addFilter:function () {
            this.send('loading');
            this.sendAction('applyFilter');
            this.send('ready');
        },
        deleteFilter:function (name, value) {
            this.send('loading');
            this.sendAction('removeFilter', name, value);
            this.send('ready');
        }
    }
});

//strictly for DS.Model models
Ember.Handlebars.registerHelper('eachMyProperty', function (context, options) {
    var ret = "";
    var newContext = Ember.get(this, context);
    var arr = [];

    Ember.get(this.get('constructor'), 'attributes').forEach(function (key, value) {
        if (value.type !== 'boolean')
            arr.push({prop:key});
    });

    $.each(arr, function (key, value) {
        var cssClass = newContext.get('cssClass');
        cssClass = cssClass(value.prop, newContext);
        if (value.prop == 'Link') {
            ret += options.fn({value:newContext.get(value.prop), link:true, params:newContext, cssClass:cssClass});
        } else if (value.prop == 'Vote') {
            ret += options.fn({value:newContext.get(value.prop), button:true, params:newContext, cssClass:cssClass});
        }
        else {
            ret += options.fn({value:newContext.get(value.prop), link:false, cssClass:cssClass});
        }
    });
    return ret;
});

Ember.Handlebars.registerHelper('if_eq', function (a, b, opts) {
    if (a == b) // Or === depending on your needs
        return opts.fn(this);
    else
        return opts.inverse(this);
});
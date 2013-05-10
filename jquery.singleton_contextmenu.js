/*!
 * Singleton contextmenu.
 *
 * (c) 2013, Oliver Dozsa
 * dozsa.oliver@gmail.com
 *
 * Dual licensed under the MIT and GPL.
 *
 */
 
/* 
 * Usage patterns:
 *
 * Create menu:
 * 
        $(some_element).singleton_contextmenu
        (
            {
                title: "Menu title",
                items:
                [
                    {label: "Label 1", action: some_callback_1, customData: some_custom_data1},
                    {label: "Label 2", action: some_callback_2, customData: some_custom_data2},
                    {label: "Label 3", action: some_callback_3, customData: some_custom_data3}
                ]
            }
        );
 *
 *   Description of parameters:
 *       title: The context menu title. Shown in as the first item.
 *       items: The clickable menu items.
 *           label:      The label of the menu item.
 *           action:     Optional parameter (function). Called when clicked on the menu item.
 *           customData: Optional parameter. If defined, the callback function will get this parameter when called
 *                       (upon click) rather than the default click event. If not defined, the callback function will
 *                       get the default click event. It's up to the user what she / he defines here.
 *
 * Detach context menu:
        $(some_element).singleton_contextmenu('detach');
 *
 */
(function($)
{
    /* == VARIABLES ==================================== */
    
    /* Set Z indexes to your need. */
    
    /* Z index for context menu whatcher. */
    var Z_INDEX_WATCHER = 10;
    
    /* Z index for the menu. */
    var Z_INDEX_MENU = Z_INDEX_WATCHER + 1;
    
    /* Z index for the context menu removal div. */
    var Z_INDEX_MENU_REMOVAL = Z_INDEX_WATCHER - 10;
    
    /* Used to keep track of how many context menus are attached. */
    var numOfMenuAttached = 0;
    
    /**
     * The default context menu structure. Will be used as a base
     * for context menu. Custom parameters should look
     * like this base structure.
     */
    var defaultContextMenuStructure = 
    {
        title: '',
  	items: []
    };
    
    /* Stores which contextmenu is shown currently. */
    var showed = undefined;
    
    /* Stores the context menu removal div. */
    var removal = undefined;
    
    
    /* == INTERNAL FUNCTIONS =========================== */
    
    /**
     * Creates and shows the context menu.
     *
     * @param params    The context menu, and position parameters.
     *
     * @return The created context menu.
     */
    function createMenu(params)
    {
        /* Destroy if there's a menu shown. */
        destroyCurrentMenu();
        
        var menu = $('<ul class = "singleton_contextmenu_menu"></ul>').appendTo($('body'));
        
        /* Calculate position. */
        var x = params.event.pageX + 5;
        var y = params.event.pageY;
        
        if(y + menu.height() >= $(window).height())
        {
            y -= menu.height();
        }
        
        if(x + menu.width() >= $(window).width())
        {
            x -= menu.width();
        }
        
        /* Set z-index for menu, and position. */
        menu.css({'z-index': Z_INDEX_MENU, 'left': x, 'top': y});
        
        /* Add title. */
        $('<li><span class = "singleton_contextmenu_title" >' + params.options.title +'</span></li>').appendTo(menu);
        
        /* Add menu items. */
        var i            = 0;
        var menuItem     = undefined;
        var htmlMenuItem = undefined;
        
        for(i = 0; i < params.options.items.length; i++)
        {
            menuItem = params.options.items[i];
            
            htmlMenuItem = $('<li><a href="#"><span></span></a></li>').appendTo(menu);
            
            htmlMenuItem.find('span').text(menuItem.label);
            
            /* Set click callback. */
            htmlMenuItem.find('a').on('click.singleton_contextmenu', clickHandler_menuItem);
            
            /* Store menu item data callback. */
            htmlMenuItem.find('a').data({action: menuItem.action, customData: menuItem.customData});
        }
        
        showed = menu;
        
        return menu;
    }
    
    /**
     * Destroys the currently shown menu.
     */
    function destroyCurrentMenu()
    {
        if(showed != undefined)
        {
            showed.remove();
        
            showed = undefined;
        }
    }
    
    /**
     * Handles right click event on the removal div. Destroys the 
     * currently shown context menu.
     *
     * @return False, preventing the default handler to trigger.
     */
    function contextMenuHandler_removal()
    {
        destroyCurrentMenu();
        
        return false;
    }
    
    /**
     * Handles left click events on menu items.
     *
     * @param eventData    Event data.
     */
    function clickHandler_menuItem(eventData)
    {
        var data = $(this).data();
        
        if(data.action && data.customData)
        {
            /* If custom data for the callback was defined, use it. */
            data.action(data.customData);
        }
        else if(data.action)
        {
            /* No custom data, but there's a callback. Use default event data. */
            data.action(eventData);
        }
        
        destroyCurrentMenu();
    }
    
    /**
     * Handles right click event on watcher. Creates and shows the context menu.
     *
     * @param eventData    Event data.
     *
     * @return False, so it prevents the default event handler to trigger.
     */
    function contextMenuHandler_createMenu(eventData)
    {
        var data = $(this).data();
        
        var createdMenu = createMenu({options: data.userOpts, event: eventData});
        
        /* Store menu attached to watcher. */
        $(this).data({contextMenu: createdMenu})
        
        return false;
    }
    
    
    /* == PUBLIC FUNCTIONS ============================= */
    
    var singleton_contextmenu_methods =
    {
        /**
         * Initializes the contextmenu.
         */
        init: function(options)
        {
            /* Merge user options with default ones. */
            var userOptions = $.extend({}, defaultContextMenuStructure, options);
            
            if(removal == undefined)
            {
                /* 
                 * If removal is not present, add it. It's an invisible div, that catches
                 * right and left click events, and destroys the currently shown menu.
                 */
                removal = $('<div class = "singleton_contextmenu_removal"></div>').appendTo($('body'))
                          /* Set z-index. */
                          .css({'z-index': Z_INDEX_MENU_REMOVAL, 'width': $(document).width(), 'height': $(document).height()})
                          /* Set right click handler. */
                          .on('contextmenu.singleton_contextmenu', contextMenuHandler_removal)
                          /* Set left click handler. */
                          .on('click.singleton_contextmenu', destroyCurrentMenu);
            }
            
            return this.each
            (
                function()
                {
                    /* Check whether already initialized on this element. */
                    var watcherOfElement = $(this).data('watcher');
                    
                    if(!watcherOfElement)
                    {   
                        var watcher = $('<div class = "singleton_contextmenu_watcher"></div>').appendTo($('body'));
                        
                        watcher
                        /* Store data for context menu. */
                        .data({userOpts: userOptions})
                        /* Set z-index, position, and dimension. */
                        .css({'z-index': Z_INDEX_WATCHER, 'left': $(this).offset().left, 'top': $(this).offset().top, 'width': $(this).outerWidth(), 'height': $(this).outerHeight()})
                        /* Attach contextmenu handler. */
                        .on('contextmenu.singleton_contextmenu', contextMenuHandler_createMenu)
                        /* Set left click handler. */
                        .on('click.singleton_contextmenu', destroyCurrentMenu);
                        
                        /* Increase counter. */
                        numOfMenuAttached++;
                        
                        /* This element now has context menu, set the watcher for it. */
                        $(this).data('watcher', watcher);
                    }
                    else
                    {
                        $.error('jquery.singleton_contextmenu already initialized!');
                    }
                }
            );
        },
        
        /**
         * Detaches the context menu 
         * (i.e. right clicking will have the default behavior on the right clicked element).
         */
        detach: function()
        {
            return this.each
            (
                function()
                {
                    var watcher = $(this).data('watcher');
            
                    if(watcher)
                    {
                        /* Context menu is not detached yet. */
                        
                        var data = watcher.data();
                    
                        if(data.contextMenu != undefined)
                        {
                            /* data.contextMenu stores the element's attached context menu. */
                            if(showed == data.contextMenu)
                            {
                                /* Showed menu is the detached menu. Remove it. */
                                destroyCurrentMenu();
                            }
                        }
                        
                        /* Will remove attached event handlers, and data. */
                        watcher.remove();
                        
                        /* Remove data for element. */
                        $(this).removeData('watcher');
                        
                        /* Decrease counter. */
                        numOfMenuAttached--;
                        
                        if(numOfMenuAttached == 0)
                        {
                            /* No more menus present, remove removal div. */
                            if(removal != undefined)
                            {
                                removal.remove();
                                
                                removal = undefined;
                            }
                        }
                    }
                }
            );
        }
    };
    
    /**
     * Controls what to do when plugin is used.
     */
    $.fn.singleton_contextmenu = function(method)
    {
        if(singleton_contextmenu_methods[method])
        {
            return singleton_contextmenu_methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        }
        else if(typeof method === 'object' || !method )
        {
            return singleton_contextmenu_methods.init.apply(this, arguments);
        }
        else
        {
            $.error('Method ' +  method + ' does not exist on jQuery.singleton_contextmenu!');
        }  
    }
})(jQuery);

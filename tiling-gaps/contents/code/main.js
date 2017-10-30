// ----------
// Parameters
// ----------

// workspace (contains all client info)
// options (contains all options)

// var gap = readConfig("gap");
// var dividerBounds = readConfig("dividerBounds"); // from this value to 1-value
// var moveOutside = readConfig("moveOutside"); // move clients outside this fraction of its own size
// 
// var margins =
// {
//   top: readConfig("topMargin"), // latte top dock height
//   bottom: readConfig("bottomMargin"),
//   left: readConfig("leftMargin"),
//   right: readConfig("rightMargin"),
// };

var gap = 16;
var dividerBounds = 0.2; // from this value to 1-value
var moveOutside = 0.5; // move clients outside this fraction of its own size

var margins =
{
  top: 32, // latte top dock height
  bottom: 0,
  left: 0,
  right: 0,
};

// smallest minType sizes
var fullClients =
[
  "texstudio",
  "inkscape",
  "gimp",
  "qtdesigner",
  "qtcreator",
  "kdevelop",
  "kdenlive",
];

var halfClients =
[
  "kate",
  "spotify",
];

// clients that are not tiled
var ignoredClients =
[
  "albert",
  "kazam",
  "krunner",
  "ksmserver",
  "lattedock",
  "pinentry",
  "Plasma",
  "plasma",
  "plasma-desktop",
  "plasmashell",
  "plugin-container",
  "simplescreenrecorder",
  "yakuake",
];

// client captions that are not tiled
var ignoredCaptions =
[
  "File Upload",
  "Move to Trash",
  "Quit GIMP",
  "Preferences (Shift+Ctrl+P)",
  "Create a New Image",
  "QEMU",
];

var deskArea =
{
  xMin: margins.left,
  yMin: margins.top,
  width: workspace.displayWidth-margins.right-margins.left,
  height: workspace.displayHeight-margins.bottom-margins.top,
};

// --------------
// Layout Classes
// --------------

function Desktop ()
{
  this.clients = [];
  this.nclients = function () {return this.clients.length;};
  
  this.size = function ()
  {
    var sum = 0;
    for (var i = 0; i < this.nclients(); i++) {sum += this.clients[i].minType;};
    return sum;
  };
  
  this.addClient = function (client)
  {
    if (CheckClient(client) === -1) {return -1;}; // on succes adds minType to client
    if (this.size()+client.minType > 1) {return -1;};
    SplitType(client, this.clients, this.nclients());
    this.clients.push(client);
    return 0;
  };
  
  this.removeClient = function (windowId)
  {
    if (this.nclients() === 0) {return -1;};
    for (var i = 0; i < this.nclients(); i++)
    {
      if (this.clients[i].windowId === windowId)
      {
        CombineType(i, this.clients, this.nclients());
        this.clients.splice(i, 1);
        return 0;
      };
    };
    return -1;
  };
  
  this.getClient = function (windowId)
  {
    if (this.nclients() === 0) {return -1;};
    for (var i = 0; i < this.nclients(); i++)
    {
      if (this.clients[i].windowId === windowId)
      {
        return this.clients[i];
      };
    };
    return -1;
  };
  
  this.switchClientLeft = function (clientIndex)
  {
    if (clientIndex >= this.nclients()) {return -1;};
    return SwitchClientLeft(clientIndex, this.clients, this.nclients());
  };
  
  this.switchClientRight = function (clientIndex)
  {
    if (clientIndex >= this.nclients()) {return -1;};
    return SwitchClientRight(clientIndex, this.clients, this.nclients());
  };
  
  this.switchClientTop = function (clientIndex)
  {
    if (clientIndex >= this.nclients()) {return -1;};
    return SwitchClientTop(clientIndex, this.clients, this.nclients());
  };
  
  this.switchClientBottom = function (clientIndex)
  {
    if (clientIndex >= this.nclients()) {return -1;};
    return SwitchClientBottom(clientIndex, this.clients, this.nclients());
  };
  
  // divider
  this.divider = 
  {
    horizontal: 0.5,
    vertical: 0.5,
  };
  
  this.setDivider = function (horizontal, vertical)
  {
    this.divider.horizontal = horizontal;
    this.divider.vertical = vertical;
    return 0;
  };
  
  this.getDivider = function ( )
  {
    return this.divider;
  };
  
  // rendering
  this.renderDesktop = function (desktopIndex, layerIndex)
  {
    return RenderClients(this.divider, this.clients, this.nclients(), desktopIndex, layerIndex);
  };
};

function Layer ()
{
  this.desktops = [];
  this.ndesktops =  function () {return this.desktops.length;};
  
  this.addDesktop = function (desktop)
  {
    if (workspace.desktops-this.ndesktops() < 1) {return -1;};
    this.desktops.push(desktop);
    return 0;
  };
  
  this.removeDesktop = function (desktopIndex)
  {
    if (desktopIndex >= this.ndesktops()) {return -1;};
    this.desktops.splice(desktopIndex, 1);
    return 0;
  };
  
  this.addClient = function (client)
  {
    var added = -1;
    for (var i = 0; i < this.ndesktops(); i++)
    {
      added = this.desktops[i].addClient(client);
      if (added === 0) {return added;};
    };
    var desktop = new Desktop();
    if (this.addDesktop(desktop) === -1) {return -1;};
    return this.desktops[this.ndesktops()-1].addClient(client);
  };
  
  this.removeClient = function (windowId)
  {
    var removed = -1;
    for (var i = 0; i < this.ndesktops(); i++)
    {
      removed = this.desktops[i].removeClient(windowId);
      if (removed === 0)
      {
        if (this.desktops[i].size() === 0) {removed = this.removeDesktop(i);};
        break;
      };
    };
    return removed;
  };
  
  this.getClient = function (windowId)
  {
    var client = -1;
    for (var i = 0; i < this.ndesktops(); i++)
    {
      client = this.desktops[i].getClient(windowId);
      if (client !== -1) {break;};
    };
    return client;
  };
  
  this.switchClientLeft = function (clientIndex, desktopIndex)
  {
    if (desktopIndex >= this.ndesktops()) {return -1;};
    return this.desktops[desktopIndex].switchClientLeft(clientIndex);
  };
  
  this.switchClientRight = function (clientIndex, desktopIndex)
  {
    if (desktopIndex >= this.ndesktops()) {return -1;};
    return this.desktops[desktopIndex].switchClientRight(clientIndex);
  };
  
  this.switchClientTop = function (clientIndex, desktopIndex)
  {
    if (desktopIndex >= this.ndesktops()) {return -1;};
    return this.desktops[desktopIndex].switchClientTop(clientIndex);
  };
  
  this.switchClientBottom = function (clientIndex, desktopIndex)
  {
    if (desktopIndex >= this.ndesktops()) {return -1;};
    return this.desktops[desktopIndex].switchClientBottom(clientIndex);
  };
  
  this.movePreviousDesktop = function (clientIndex, desktopIndex)
  {
    for (var i = desktopIndex-1; i >= 0; i--)
    {
      if (this.desktops[i].addClient(this.desktops[desktopIndex].clients[clientIndex]) === 0)
      {
        this.desktops[desktopIndex].clients.splice(clientIndex, 1);
        return 0;
      };
    };
    return -1;
  };
  
  this.moveNextDesktop = function (clientIndex, desktopIndex)
  {
    for (var i = desktopIndex+1; i < this.ndesktops(); i++)
    {
      if (this.desktops[i].addClient(this.desktops[desktopIndex].clients[clientIndex]) === 0)
      {
        this.desktops[desktopIndex].clients.splice(clientIndex, 1);
        return 0;
      };
    };
    return -1;
  };
  
  // divider
  this.setDivider = function (horizontal, vertical, desktopIndex)
  {
    if (desktopIndex >= this.ndesktops()) {return -1;};
    return this.desktops[desktopIndex].setDivider(horizontal, vertical);
  };
  
  this.getDivider = function (desktopIndex)
  {
    if (desktopIndex >= this.ndesktops()) {return -1;};
    return this.desktops[desktopIndex].getDivider();
  };
  
  // rendering
  this.renderLayer = function (layerIndex)
  {
    var render = -1;
    for (var i = 0; i < this.ndesktops(); i++)
    {
      render = this.desktops[i].renderDesktop(i, layerIndex);
    };
    return render;
  };
  
  this.renderDesktop = function (desktopIndex, layerIndex)
  {
    if (desktopIndex >= this.ndesktops()) {return -1;};
    return this.desktops[desktopIndex].renderDesktop(desktopIndex, layerIndex);
  };
};

function Layout ()
{
  this.layers = [];
  this.nlayers = function () {return this.layers.length;};
  
  this.addLayer = function (layer) 
  {
    this.layers.push(layer);
    return 0;
  };
  
  this.removeLayer = function (layerIndex)
  {
    if (layerIndex >= this.nlayers()) {return -1;};
    this.layers.splice(layerIndex, 1);
    return 0;
  };
  
  this.addDesktop = function (desktop)
  {
    var added = -1;
    for (var i = 0; i < this.nlayers(); i++)
    {
      added = this.layers[i].addDesktop(desktop);
      if (added === 0) {return added};
    };
    var layer = new Layer();
    this.addLayer(layer);
    return this.layers[this.nlayers() - 1].addDesktop(desktop);
  };
  
  this.removeDesktop = function (desktopIndex, layerIndex)
  {
    if (layerIndex >= this.nlayers()) {return -1;};
    return this.layers[layerIndex].removeDesktop(desktopIndex);
  };
  
  this.addClient = function (client)
  {
    var added = -1;
    for (var i = 0; i < this.nlayers(); i++)
    {
      added = this.layers[i].addClient(client);
      if (added === 0) {return added};
    };
    var layer = new Layer();
    this.addLayer(layer);
    return this.layers[this.nlayers()-1].addClient(client);
  };
  
  this.removeClient = function (windowId)
  {
    removed = -1;
    for (var i = 0; i < this.nlayers(); i++)
    {
      removed = this.layers[i].removeClient(windowId);
      if (removed === 0)
      {
        if (this.layers[i].ndesktops() === 0) {removed = this.removeLayer(i);};
        break;
      };
    };
    return removed;
  };
  
  this.getClient = function (windowId)
  {
    client = -1;
    for (var i = 0; i < this.nlayers(); i++)
    {
      client = this.layers[i].getClient(windowId);
      if (client !== -1) {break;};
    };
    return client;
  };
  
  this.switchClientLeft = function (clientIndex, desktopIndex, layerIndex)
  {
    if (layerIndex >= this.nlayers()) {return -1;};
    return this.layers[layerIndex].desktops[desktopIndex].switchClientLeft(clientIndex);
  };
  
  this.switchClientRight = function (clientIndex, desktopIndex, layerIndex)
  {
    if (layerIndex >= this.nlayers()) {return -1;};
    return this.layers[layerIndex].desktops[desktopIndex].switchClientRight(clientIndex);
  };
  
  this.switchClientTop = function (clientIndex, desktopIndex, layerIndex)
  {
    if (layerIndex >= this.nlayers()) {return -1;};
    return this.layers[layerIndex].desktops[desktopIndex].switchClientTop(clientIndex);
  };
  
  this.switchClientBottom = function (clientIndex, desktopIndex, layerIndex)
  {
    if (layerIndex >= this.nlayers()) {return -1;};
    return this.layers[layerIndex].desktops[desktopIndex].switchClientBottom(clientIndex);
  };
  
  this.movePreviousDesktop = function (clientIndex, desktopIndex, layerIndex)
  {
    if (layerIndex >= this.nlayers()) {return -1;};
    return this.layers[layerIndex].movePreviousDesktop(clientIndex, desktopIndex);
  };
  
  this.moveNextDesktop = function (clientIndex, desktopIndex, layerIndex)
  {
    if (layerIndex >= this.nlayers()) {return -1;};
    return this.layers[layerIndex].moveNextDesktop(clientIndex, desktopIndex);
  };
  
  // divider
  this.setDivider = function (horizontal, vertical, desktopIndex, layerIndex)
  {
    if (layerIndex >= this.nlayers()) {return -1;};
    return this.layers[layerIndex].setDivider(horizontal, vertical, desktopIndex);
  };
  
  this.getDivider = function (desktopIndex, layerIndex)
  {
    if (layerIndex >= this.nlayers()) {return -1;};
    return this.layers[layerIndex].getDivider(desktopIndex);
  };
  
  // rendering
  this.renderLayout = function ()
  {
    var render = -1;
    for (var i = 0; i < this.nlayers(); i++)
    {
      render = this.layers[i].renderLayer(i);
    };
    return render;
  };
  
  this.renderLayer = function (layerIndex)
  {
    if (layerIndex >= this.nlayers()) {return -1;};
    return this.layers[layerIndex].renderLayer();
  };
  
  this.renderDesktop = function (desktopIndex, layerIndex)
  {
    if (layerIndex >= this.nlayers()) {return -1;};
    return this.layers[layerIndex].renderDesktop(desktopIndex, layerIndex);
  };
};

// --------------
// Type Functions
// --------------

var typeF = {left: true, right: true, top: true, bottom: true, size: 1}; // full
var typeLH = {left: true, right: false, top: true, bottom: true, size: 0.5}; // left half
var typeRH = {left: false, right: true, top: true, bottom: true, size: 0.5}; // right half
var typeTLQ = {left: true, right: false, top: true, bottom: false, size: 0.25}; // top left quarter
var typeTRQ = {left: false, right: true, top: true, bottom: false, size: 0.25}; // top right quarter
var typeBRQ = {left: false, right: true, top: false, bottom: true, size: 0.25}; // bottom right quarter
var typeBLQ = {left: true, right: false, top: false, bottom: true, size: 0.25}; // bottom left quarter

function FindType (type, clients, nclients)
{
  var found = -1;
  for (var i = 0; i < nclients; i++)
  {
    if (clients[i].type === type)
    {
      found = i;
      break;
    };
  };
  return found;
};

function FindLargestType (clients, nclients)
{
  var index = -1;
  var largest = 0;
  for (var i = 0; i < nclients; i++)
  {
    var size = clients[i].type.size;
    if (size > largest)
    {
      index = i;
      largest = size;
    }
    else if (size === largest && clients[i].type.right) // prefer to find the right tile, when same size
    {
      index = i;
    };
  };
  return index;
};

function SplitType (client, clients, nclients)
{
  if (nclients === 0)
  {
    client.type = typeF;
    return 0;
  };
  
  var index = FindLargestType(clients, nclients);
  if (clients[index].type === typeF)
  {
    clients[index].type = typeLH;
    client.type = typeRH;
    return 0;
  }
  else if (clients[index].type === typeLH)
  {
    clients[index].type = typeTLQ;
    client.type = typeBLQ;
    return 0;
  }
  else if (clients[index].type === typeRH)
  {
    clients[index].type = typeTRQ;
    client.type = typeBRQ;
    return 0;
  }
  else
  {
    return -1;
  };
};

function CombineType (clientIndex, clients, nclients)
{
  var type = clients[clientIndex].type;
  if (type === typeLH)
  {
    if (nclients === 2)
    {
      clients[FindType(typeRH, clients, nclients)].type = typeF;
    }
    else if (nclients === 3)
    {
      clients[FindType(typeTRQ, clients, nclients)].type = typeLH;
      clients[FindType(typeBRQ, clients, nclients)].type = typeRH;
    };
  }
  else if (type === typeRH)
  {
    if (nclients === 2)
    {
      clients[FindType(typeLH, clients, nclients)].type = typeF;
    }
    else if (nclients === 3)
    {
      clients[FindType(typeTLQ, clients, nclients)].type = typeLH;
      clients[FindType(typeBLQ, clients, nclients)].type = typeRH;
    };
  }
  else if (type === typeTLQ)
  {
    clients[FindType(typeBLQ, clients, nclients)].type = typeLH;
  }
  else if (type === typeTRQ)
  {
    clients[FindType(typeBRQ, clients, nclients)].type = typeRH;
  }
  else if (type === typeBRQ)
  {
    clients[FindType(typeTRQ, clients, nclients)].type = typeRH;
  }
  else if (type === typeBLQ)
  {
    clients[FindType(typeTLQ, clients, nclients)].type = typeLH;
  }
  else
  {
    return -1;
  };
};

// -------------
// Client Moving
// -------------

function MoveClientLeft (clientIndex, clients, nclients)
{
  if (clients[clientIndex].type === typeRH) {clients[clientIndex].type = typeLH; return 0;};
  if (clients[clientIndex].type === typeTRQ) {clients[clientIndex].type = typeTLQ; return 0;};
  if (clients[clientIndex].type === typeBRQ) {clients[clientIndex].type = typeBLQ; return 0;};
  return -1;
};

function MoveClientRight (clientIndex, clients, nclients)
{
  if (clients[clientIndex].type === typeLH) {clients[clientIndex].type = typeRH; return 0;};
  if (clients[clientIndex].type === typeTLQ) {clients[clientIndex].type = typeTRQ; return 0;};
  if (clients[clientIndex].type === typeBLQ) {clients[clientIndex].type = typeBRQ; return 0;};
  return -1;
};

function MoveClientTop (clientIndex, clients, nclients)
{
  if (clients[clientIndex].type === typeBLQ) {clients[clientIndex].type = typeTLQ; return 0;};
  if (clients[clientIndex].type === typeBRQ) {clients[clientIndex].type = typeTRQ; return 0;};
  return -1;
};

function MoveClientBottom (clientIndex, clients, nclients)
{
  if (clients[clientIndex].type === typeTLQ) {clients[clientIndex].type = typeBLQ; return 0;};
  if (clients[clientIndex].type === typeTRQ) {clients[clientIndex].type = typeBRQ; return 0;};
  return -1;
};

function MoveAllClientsLeft (clients, nclients)
{
  for (var i = 0; i < nclients; i++)
  {
    MoveClientLeft(i, clients, nclients);
  };
  return 0;
};

function MoveAllClientsRight (clients, nclients)
{
  for (var i = 0; i < nclients; i++)
  {
    MoveClientRight(i, clients, nclients);
  };
  return 0;
};

function MoveAllClientsTop (clients, nclients)
{
  for (var i = 0; i < nclients; i++)
  {
    MoveClientTop(i, clients, nclients);
  };
  return 0;
};

function MoveAllClientsBottom (clients, nclients)
{
  for (var i = 0; i < nclients; i++)
  {
    MoveClientBottom(i, clients, nclients);
  };
  return 0;
};

function SwitchClientLeft (clientIndex, clients, nclients)
{
  if (clientIndex >= nclients || clients[clientIndex].type.left) {return -1;};
  
  var type = clients[clientIndex].type;
  if (type.size === 0.5)
  {
    MoveAllClientsRight(clients, nclients);
    MoveClientLeft(clientIndex, clients, nclients);
  }
  else if (type.size === 0.25)
  {
    var index = FindType(typeLH, clients, nclients);
    if (index !== -1)
    {
      MoveAllClientsLeft(clients, nclients);
      MoveClientRight(index, clients, nclients);
    }
    else if (type === typeTRQ)
    {
      MoveClientRight(FindType(typeTLQ, clients, nclients), clients, nclients);
      MoveClientLeft(clientIndex, clients, nclients);
    }
    else if (type === typeBRQ)
    {
      MoveClientRight(FindType(typeBLQ, clients, nclients), clients, nclients);
      MoveClientLeft(clientIndex, clients, nclients);
    };
  }
  else
  {
    return -1;
  };
  return 0;
};

function SwitchClientRight (clientIndex, clients, nclients)
{
  if (clientIndex >= nclients || clients[clientIndex].type.right) {return -1;};
  
  var type = clients[clientIndex].type;
  if (type.size === 0.5)
  {
    MoveAllClientsLeft(clients, nclients);
    MoveClientRight(clientIndex, clients, nclients);
  }
  else if (type.size === 0.25)
  {
    var index = FindType(typeRH, clients, nclients);
    if (index !== -1)
    {
      MoveAllClientsRight(clients, nclients);
      MoveClientLeft(index, clients, nclients);
    }
    else if (type === typeTLQ)
    {
      MoveClientLeft(FindType(typeTRQ, clients, nclients), clients, nclients);
      MoveClientRight(clientIndex, clients, nclients);
    }
    else if (type === typeBLQ)
    {
      MoveClientLeft(FindType(typeBRQ, clients, nclients), clients, nclients);
      MoveClientRight(clientIndex, clients, nclients);
    };
  }
  else
  {
    return -1;
  };
  return 0;
};

function SwitchClientTop (clientIndex, clients, nclients)
{
  if (clientIndex >= nclients || clients[clientIndex].type.top) {return -1;};
  
  var type = clients[clientIndex].type;
  if (type === typeBLQ)
  {
    MoveClientBottom(FindType(typeTLQ, clients, nclients), clients, nclients);
    MoveClientTop(clientIndex, clients, nclients);
  }
  else if (type === typeBRQ)
  {
    MoveClientBottom(FindType(typeTRQ, clients, nclients), clients, nclients);
    MoveClientTop(clientIndex, clients, nclients);
  }
  else
  {
    return -1;
  };
  return 0;
};

function SwitchClientBottom (clientIndex, clients, nclients)
{
  if (clientIndex >= nclients || clients[clientIndex].type.bottom) {return -1;};
  
  var type = clients[clientIndex].type;
  if (type === typeTLQ)
  {
    MoveClientTop(FindType(typeBLQ, clients, nclients), clients, nclients);
    MoveClientBottom(clientIndex, clients, nclients);
  }
  else if (type === typeTRQ)
  {
    MoveClientTop(FindType(typeBRQ, clients, nclients), clients, nclients);
    MoveClientBottom(clientIndex, clients, nclients);
  }
  else
  {
    return -1;
  };
  return 0;
};

function GeometryResized (windowId)
{
  var client = layout.getClient(windowId);
  
  var resizedWidth = (client.geometryRender.width !== client.geometry.width);
  var resizedHeight = (client.geometryRender.height !== client.geometry.height);
  if (!resizedWidth && !resizedHeight) {return -1;};
  var diffWidth = client.geometry.width-client.geometryRender.width;
  var diffHeight = client.geometry.height-client.geometryRender.height;
  var divider = layout.getDivider(client.desktopIndex, client.layerIndex);
  
  if (resizedWidth)
  {
    if (client.type.left && !client.type.right)
    {
      divider.vertical += diffWidth/(workspace.displayWidth);
    };
    if (!client.type.left && client.type.right)
    {
      divider.vertical -= diffWidth/(workspace.displayWidth);
    };
  };
  if (resizedHeight)
  {
    if (client.type.top && !client.type.bottom)
    {
      divider.horizontal += diffHeight/(workspace.displayHeight);
    };
    if (!client.type.top && client.type.bottom)
    {
      divider.horizontal -= diffHeight/(workspace.displayHeight);
    };
  };
  
  if (divider.horizontal < dividerBounds) {divider.horizontal = dividerBounds;};
  if (divider.horizontal > 1-dividerBounds) {divider.horizontal = 1-dividerBounds;};
  if (divider.vertical < dividerBounds) {divider.vertical = dividerBounds;};
  if (divider.vertical > 1-dividerBounds) {divider.vertical = 1-dividerBounds;};
  
  return 0;
};

function GeometryMoved (windowId)
{
  var client = layout.getClient(windowId);
  
  var movedX = (client.geometryRender.x !== client.geometry.x && !(client.geometryRender.width !== client.geometry.width));
  var movedY = (client.geometryRender.y !== client.geometry.y && !(client.geometryRender.height !== client.geometry.height));
  if (!movedX && !movedY) {return -1;};
  var diffX = client.geometry.x-client.geometryRender.x;
  var diffY = client.geometry.y-client.geometryRender.y;
  
  if (movedX)
  {
    if (diffX > moveOutside*client.width)
    {
      layout.switchClientRight(client.clientIndex, client.desktopIndex, client.layerIndex);
    }
    else if (diffX < -moveOutside*client.width)
    {
      layout.switchClientLeft(client.clientIndex, client.desktopIndex, client.layerIndex);
    };
  };
  if (movedY)
  {
    if (diffY > moveOutside*client.height)
    {
      layout.switchClientBottom(client.clientIndex, client.desktopIndex, client.layerIndex);
    }
    else if (diffY < -moveOutside*client.height)
    {
      layout.switchClientTop(client.clientIndex, client.desktopIndex, client.layerIndex);
    };
  };
  return 0;
};

// ----------------
// Client Rendering
// ----------------

function SetClient (client, x, y, width, height, clientIndex, desktopIndex, layerIndex)
{
  var geometry = 
  {
    x: Math.floor(x),
    y: Math.floor(y),
    width: Math.floor(width),
    height: Math.floor(height),
  };
  
  client.desktop = desktopIndex+1;
  client.geometry = geometry;
  client.geometryRender = geometry;
  client.clientIndex = clientIndex;
  client.desktopIndex = desktopIndex;
  client.layerIndex = layerIndex;
  return 0;
};

function RenderClients (divider, clients, nclients, desktopIndex, layerIndex)
{
  var w = deskArea.width-3*gap; // width
  var h = deskArea.height-3*gap; // height
  
  var lw = divider.vertical*w; // left width
  var rw = (1-divider.vertical)*w; // right width
  var th = divider.horizontal*h; // top height
  var bh = (1-divider.horizontal)*h; // bottom height
  
  var sx = gap+deskArea.xMin; // start x
  var hx = sx+lw+gap; // half x
  
  var sy = gap+deskArea.yMin; // start y
  var hy = sy+th+gap; // half left y
  
  for (var i = 0; i < nclients; i++)
  {
    var client = clients[i];
    if (client.type === typeF)
    {
      SetClient(client, sx, sy, w+gap, h+gap, i, desktopIndex, layerIndex);
      continue;
    };
    if (client.type === typeLH)
    {
      SetClient(client, sx, sy, lw, h+gap, i, desktopIndex, layerIndex);
      continue;
    };
    if (client.type === typeRH)
    {
      SetClient(client, hx, sy, rw, h+gap, i, desktopIndex, layerIndex);
      continue;
    };
    if (client.type === typeTLQ)
    {
      SetClient(client, sx, sy, lw, th, i, desktopIndex, layerIndex);
      continue;
    };
    if (client.type === typeTRQ)
    {
      SetClient(client, hx, sy, rw, th, i, desktopIndex, layerIndex);
      continue;
    };
    if (client.type === typeBRQ)
    {
      SetClient(client, hx, hy, rw, bh, i, desktopIndex, layerIndex);
      continue;
    };
    if (client.type === typeBLQ)
    {
      SetClient(client, sx, hy, lw, bh, i, desktopIndex, layerIndex);
      continue;
    };
  };
  return 0;
};

// ---------------
// Client Validity
// ---------------

function CheckClient (client)
{  
  if (client.specialWindow) {return -1;};
  
  var clientClass = client.resourceClass.toString();
  var clientName = client.resourceName.toString();
  var clientCaption = client.caption.toString();
  
  for (var i = 0; i < ignoredCaptions.length; i++)
  {
    if (ignoredCaptions[i] === clientCaption) {return -1;};
  };
  
  for (var i = 0; i < ignoredClients.length; i++)
  {
    if (clientClass.indexOf(ignoredClients[i]) !== -1) {return -1;};
    if (clientName.indexOf(ignoredClients[i]) !== -1) {return -1;};
  };
  
  var minType = 0.25;
  for (var i = 0; i < halfClients.length; i++)
  {
    if (clientClass.indexOf(halfClients[i]) !== -1 || clientClass.indexOf(halfClients[i]) !== -1)
    {
      minType = 0.5;
      break;
    };
  };
  for (var i = 0; i < fullClients.length; i++)
  {
    if (clientClass.indexOf(fullClients[i]) !== -1 || clientName.indexOf(fullClients[i]) !== -1)
    {
      minType = 1;
      break;
    };
  };
  
  client.minType = minType;
  return client;
};

// ---------------------------
// Connecting The KWin Signals
// ---------------------------

var addedClients = {}; // windowId of added clients
var layout = new Layout(); // main class, contains all methods

workspace.clientActivated.connect // clientAdded does not work for a lot of clients
(
  function (client)
  {
    if (client === null || client.windowId in addedClients) {return -1;};
    if (layout.addClient(client) === -1) {return -1;};
    addedClients[client.windowId] = true;
    layout.renderLayout();
    workspace.currentDesktop = client.desktop;
    ConnectClient(client); // connect client signals
    return 0;
  }
);

workspace.clientRemoved.connect
(
  function (client)
  {
    if (!(client.windowId in addedClients)) {return -1;};
    delete addedClients[client.windowId];
    
    var removed = layout.removeClient(client.windowId);
    if (removed === 0)
    {
      layout.renderLayout();
    };
    return removed;
  }
);

function ConnectClient (client)
{
  client.clientFinishUserMovedResized.connect
  (
    function (client)
    {
      if (GeometryResized(client.windowId) === -1 && GeometryMoved(client.windowId) === -1) {return -1;};
      return layout.renderLayout();
    }
  );
  client.clientStepUserMovedResized.connect
  (
    function (client)
    {
      if (GeometryResized(client.windowId) === -1) {return -1;};
      return layout.renderLayout();
    }
  );
  return 0;
};

// ------------------
// Creating Shortcuts
// ------------------

registerShortcut
(
  "Tiling-Gaps: Move Next Desktop",
  "Tiling-Gaps: Move Next Desktop",
  "Meta+End",
  function ()
  {
    client = layout.getClient(workspace.activeClient.windowId);
    if (client === -1) {return -1;};
    return layout.moveNextDesktop(client.clientIndex, client.desktopIndex, client.layerIndex);
  }
);

registerShortcut
(
  "Tiling-Gaps: Move Previous Desktop",
  "Tiling-Gaps: Move Previous Desktop",
  "Meta+Home",
  function ()
  {
    client = layout.getClient(workspace.activeClient.windowId);
    if (client === -1) {return -1;};
    return layout.SwitchPreviousDesktop(client.clientIndex, client.desktopIndex, client.layerIndex);
  }
);

registerShortcut
(
  "Tiling-Gaps: Switch Up",
  "Tiling-Gaps: Switch Up",
  "Meta+Alt+Up",
  function ()
  {
    client = layout.getClient(workspace.activeClient.windowId);
    if (client === -1) {return -1;};
    return layout.switchClientTop(client.clientIndex, client.desktopIndex, client.layerIndex);
  }
);

registerShortcut
(
  "Tiling-Gaps: Switch Down",
  "Tiling-Gaps: Switch Down",
  "Meta+Alt+Down",
  function ()
  {
    client = layout.getClient(workspace.activeClient.windowId);
    if (client === -1) {return -1;};
    return layout.switchClientBottom(client.clientIndex, client.desktopIndex, client.layerIndex);
  }
);

registerShortcut
(
  "Tiling-Gaps: Switch Left",
  "Tiling-Gaps: Switch Left",
  "Meta+Alt+Left",
  function ()
  {
    client = layout.getClient(workspace.activeClient.windowId);
    if (client === -1) {return -1;};
    return layout.switchClientLeft(client.clientIndex, client.desktopIndex, client.layerIndex);
  }
);

registerShortcut
(
  "Tiling-Gaps: Switch Right",
  "Tiling-Gaps: Switch Right",
  "Meta+Alt+Right",
  function ()
  {
    client = layout.getClient(workspace.activeClient.windowId);
    if (client === -1) {return -1;};
    return layout.switchClientRight(client.clientIndex, client.desktopIndex, client.layerIndex);
  }
);

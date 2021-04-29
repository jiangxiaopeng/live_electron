import React from 'react';
import {HashRouter, Route, Switch} from 'react-router-dom';
import ClassRoomPage from './pages/class_room_page';

const BasicRoute = () => (
    <HashRouter>
        <Switch>
            <Route exact path="/" component={ClassRoomPage}/>
        </Switch>
    </HashRouter>
);

export default BasicRoute;
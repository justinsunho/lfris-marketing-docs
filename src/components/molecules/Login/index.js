import React from 'react';
import { handleLogin, handleLogout, isLoggedIn } from 'services/auth'

class Login extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            login: isLoggedIn()
        }
        this._handleLogin = this._handleLogin.bind(this);

        this._handleLogout = this._handleLogout.bind(this);
    }

    _handleLogin = () => {
        handleLogin()
        this.setState({login: isLoggedIn()})
    }

    _handleLogout = () => {
        handleLogout()
        this.setState({login: isLoggedIn()})
    }

    render() {
       return(
           !this.state.login ? 
            (<button className="" onClick={handleLogin}>
                Login
            </button>) :
            (<button className="" onClick={handleLogout}>
            Logout
             </button>)
        )
    }
}

export default Login;

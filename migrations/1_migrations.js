const UserListManagement = artifacts.require("UserListManagement");

module.exports = function (deployer) {
  deployer.deploy(UserListManagement);
};

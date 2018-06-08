/**
 * Tests for our build scripts.
 * @file util.spec.js
 */

'use strict';

const chai = require('chai');
const originalPlatform = process.platform;
const path = require('path');
chai.should();

const setPlatform = function(platform) {
  Object.defineProperty(process, 'platform', {value: platform});
};
const resetPlatform = function() {
  Object.defineProperty(process, 'platform', {value: originalPlatform});
};

const util = require('./../../scripts/util');

describe('scripts', () => {
  describe('#bumpVersion', () => {
    it('should bump patch version by default', () => {
      util.bumpVersion('1.0.0').should.equal('1.0.1');
    });

    it('should bump prerelease version with beta by default', () => {
      util.bumpVersion('1.0.0-beta.1', 'prerelease').should.equal('1.0.0-beta.2');
    });

    it('should bump prerelease version with something else when specified', () => {
      util.bumpVersion('1.0.0-whatevs.5', 'prerelease', 'whatevs').should.equal('1.0.0-whatevs.6');
    });

    it('should bump patch version when specified', () => {
      util.bumpVersion('1.0.0', 'patch').should.equal('1.0.1');
    });

    it('should bump minor version when specified', () => {
      util.bumpVersion('1.0.0', 'minor').should.equal('1.1.0');
    });

    it('should bump major version when specified', () => {
      util.bumpVersion('1.0.0', 'major').should.equal('2.0.0');
    });

    it('should bump patch version when using unspecified bump type', () => {
      util.bumpVersion('1.0.0', 'jacksonbrowne').should.equal('1.0.1');
    });
  });

  describe('#cliTargetOs', () => {
    it('should be macos on darwin', () => {
      setPlatform('darwin');
      util.cliTargetOs().should.equal('macos');
      resetPlatform();
    });

    it('should be win on windoze', () => {
      setPlatform('win32');
      util.cliTargetOs().should.equal('win');
      resetPlatform();
    });

    it('should be linux on linux', () => {
      setPlatform('linux');
      util.cliTargetOs().should.equal('linux');
      resetPlatform();
    });

    it('should be linux on everything else', () => {
      setPlatform('wefwef');
      util.cliTargetOs().should.equal('linux');
      resetPlatform();
    });
  });

  describe('#cliPkgTask', () => {
    it('should have yarn --production as first command', () => {
      const command = util.cliPkgTask('thing');
      command[0].should.equal('yarn --production');
    });

    it('should use output arg as output file', () => {
      const command = util.cliPkgTask('thing');
      const parts = command[1].split(' ');
      parts[7].should.equal('thing');
    });

    it('should use os target from clitTargetOS', () => {
      const target = util.cliTargetOs();
      const command = util.cliPkgTask('thing');
      const os = command[1].split(' ')[3].split('-')[1];
      os.should.equal(target);
    });

    it('should chmod+x and sleep on posix', () => {
      setPlatform('darwin');
      const c1 = util.cliPkgTask('thing');
      c1[2].should.equal('chmod +x thing');
      c1[3].should.equal('sleep 2');
      resetPlatform();
      setPlatform('linux');
      const c2 = util.cliPkgTask('thing');
      c2[2].should.equal('chmod +x thing');
      c2[3].should.equal('sleep 2');
      resetPlatform();
    });

    it('should not chmod+x and sleep on windoze', () => {
      setPlatform('win32');
      const command = util.cliPkgTask('thing');
      command.should.be.length(2);
      resetPlatform();
    });
  });

  describe('#fixAlias', () => {
    it('should return itself if no alias property', () => {
      const command = util.fixAlias({thing: 'stuff'});
      command.thing.should.equal('stuff');
      command.should.not.have.property('name');
    });

    it('should return itself if has alias property but it doesnt need wrapping', () => {
      const command = util.fixAlias({alias: 'stuff'});
      command.alias.should.equal('stuff');
      command.should.not.have.property('name');
    });

    it('should return itself if has alias that needs wrapping but alias starts with \\\'lando.', () => {
      const command = util.fixAlias({alias: 'fuck.lando.thing'});
      command.alias.should.equal('fuck.lando.thing');
      command.should.not.have.property('name');
    });

    it('should return adjusted object if alias needs to be wrapped', () => {
      const command = util.fixAlias({alias: 'lando.thing'});
      command.alias.should.equal('lando.thing');
      command.name.should.equal('lando.thing');
      command.scope.should.equal('global');
      command.kind.should.equal('function');
      command.should.not.have.property('memberof');
    });
  });

  describe('#psTask', () => {
    it('should be a powershell command', () => {
      const command = util.psTask('thing');
      command[0].should.equal('PowerShell -NoProfile -ExecutionPolicy Bypass -Command');
      command[1].should.equal('thing');
      command[2].should.equal('&& EXIT /B %errorlevel%');
    });
  });

  describe('#parseCommand', () => {
    it('should be an object with run and opts keys', () => {
      const command = util.parseCommand('thing stuff');
      command.run[0].should.equal('thing');
      command.run[1].should.equal('stuff');
      command.opts.mode.should.equal('collect');
      command.opts.cwd.should.equal(path.resolve('.'));
    });
  });

  describe('#installerPkgTask', () => {
    it('should be scripts/build-darwin.sh on darwin', () => {
      setPlatform('darwin');
      const command = util.installerPkgTask();
      command.should.equal('scripts/build-darwin.sh');
      resetPlatform();
    });

    it('should be scripts/build-linux.sh on linux', () => {
      setPlatform('linux');
      const command = util.installerPkgTask();
      command.should.equal('scripts/build-linux.sh');
      resetPlatform();
    });

    it('should be a PS command that runs scripts/build-win32.ps1 on windoze', () => {
      setPlatform('win32');
      const command = util.installerPkgTask();
      command[0].should.equal('PowerShell -NoProfile -ExecutionPolicy Bypass -Command');
      command[1].should.equal('scripts/build-win32.ps1');
      command[2].should.equal('&& EXIT /B %errorlevel%');
      resetPlatform();
    });
  });
});
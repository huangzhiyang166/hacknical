import React from 'react';
import GitHubCalendar from 'github-calendar';
import cx from 'classnames';
import objectAssign from 'object-assign';
import 'github-calendar/dist/github-calendar.css';

import Api from 'API/index';
import { GREEN_COLORS } from 'UTILS/colors';
import Loading from 'COMPONENTS/Loading';
import FloatingActionButton from 'COMPONENTS/FloatingActionButton';
import CommitInfo from 'COMPONENTS/Github/CommitInfo';
import LanguageInfo from 'COMPONENTS/Github/LanguageInfo';
import RepositoryInfo from 'COMPONENTS/Github/RepositoryInfo';
import UserInfo from 'COMPONENTS/Github/UserInfo';
import ShareModal from 'SHAREDPAGE/components/ShareModal';

import USER from 'SRC/data/user';
import github from 'UTILS/github';
import {
  sortRepos
} from 'UTILS/helper';

import styles from '../styles/github.css';


class GithubComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      loaded: false,
      openModal: false,
      openShareModal: false,
      user: objectAssign({}, USER),
      repos: [],
      reposLanguages: [],
      chosedRepos: [],
      showedReposId: null,
      commitDatas: [],
      commitInfos: [],
    };
    this.githubCalendar = false;
    this.changeShareStatus = this.changeShareStatus.bind(this);
    this.toggleShareModal = this.toggleShareModal.bind(this);
  }

  componentDidMount() {
    const { repos, login, loaded } = this.state;
    this.getGithubInfo(login);
    if (!repos.length) {
      this.getGithubRepos(login);
    }
  }

  componentDidUpdate() {
    const { user } = this.state;
    if (!this.githubCalendar && user.login) {
      this.githubCalendar = true;
      GitHubCalendar("#calendar", user.login);
    }
  }

  getGithubInfo(login = '') {
    Api.github.getUser(login).then((result) => {
      this.changeState({ user: result });
      this.toggleLoading(false);
    });
  }

  changeState(newState) {
    this.setState(newState);
  }

  getGithubRepos(login = '') {
    Api.github.getRepos(login).then((result) => {
      const { repos, commits } = result;
      this.setGithubRepos(result);
    });
  }

  setGithubRepos(result) {
    const { repos, commits } = result;
    this.setState({
      loaded: true,
      repos: [...repos],
      commitDatas: [...commits],
      commitInfos: github.combineReposCommits([...commits]),
      reposLanguages: [...github.getReposLanguages(repos)]
    })
  }

  changeShareStatus() {
    const { user } = this.state;
    const { openShare } = user;
    Api.github.toggleShare(!openShare).then((result) => {
      this.toggleShare(!openShare);
    });
  }

  toggleShare(openShare) {
    const { user } = this.state;
    this.setState({
      user: objectAssign({}, user, {
        openShare
      })
    });
  }

  toggleLoading(loading) {
    this.setState({ loading });
  }

  toggleShareModal(openShareModal) {
    this.setState({ openShareModal })
  }

  render() {
    const {
      user,
      repos,
      openModal,
      isShare,
      openShareModal,
      reposLanguages,
      showedReposId,
      commitDatas,
      commitInfos,
      loaded
    } = this.state;

    const origin = window.location.origin;

    return (
      <div>
        <div className={styles["info_card_container"]}>
          <p><i aria-hidden="true" className="fa fa-cloud-upload"></i>&nbsp;&nbsp;活跃度</p>
          <div id="calendar" className={styles["github_calendar"]}>
            <Loading />
          </div>
        </div>
        <UserInfo user={user} />
        <RepositoryInfo
          showedReposId={showedReposId}
          commitDatas={commitDatas}
          flatRepos={repos.filter(repository => !repository.fork).sort(sortRepos())}
          username={user && user.name}
        />
        <LanguageInfo
          repos={repos}
          loaded={repos.length > 0}
          showedReposId={showedReposId}
          languageDistributions={github.getLanguageDistribution(repos)}
          languageUsed={github.getLanguageUsed(repos)}
          languageSkills={github.getLanguageSkill(repos)}
        />
        <CommitInfo
          loaded={loaded}
          commitDatas={commitDatas}
          commitInfos={commitInfos}
          hasCommits={commitDatas.length > 0}
        />
        {openShareModal ? (
          <ShareModal
            openModal={openShareModal}
            options={{
              openShare: user.openShare,
              link: `${origin}/github/${user.login}`,
              text: '分享你的 github 总结'
            }}
            toggleShare={this.changeShareStatus}
            onClose={() => this.toggleShareModal(false)}
          />
        ) : ''}
        {!isShare ? (
          <FloatingActionButton
            icon="share-alt"
            style={{
              right: '20%',
              backgroundColor: GREEN_COLORS[1]
            }}
            onClick={() => this.toggleShareModal(true)}
          />
        ) : ''}
      </div>
    )
  }
}

export default GithubComponent;
